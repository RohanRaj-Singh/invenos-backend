# Data Lifecycle Framework — Architecture & Implementation Plan

**Date:** 2026-07-28
**Status:** Architecture lock — ready for phased implementation

> **Golden Rule:** Historical business documents must never change after they are created. Lifecycle operations may reverse or deactivate business effects, but they must never rewrite historical records.
>
> Deleting a Sale must never edit the original invoice. It must mark it deleted, reverse inventory, reverse financial impact, and preserve the original document. This is how mature accounting systems behave.

---

## Executive Summary

Every business record moves through a predictable lifecycle. The system should manage this consistently — not through ad-hoc delete buttons.

This document proposes a **platform-wide Data Lifecycle Framework** built on capability-based interfaces (`Archivable`, `Deletable`, `Restorable`), per-entity Lifecycle Policies, a Business Validation Layer, and a Recycle Bin. Every module that needs lifecycle support registers the capabilities it needs; the framework handles the rest.

---

## 1. The Lifecycle

```
    ┌──────────┐
    │  CREATE  │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │  ACTIVE  │◄────────────────────────────────────┐
    └────┬─────┘                                      │
         │                                            │
    ┌────┴────────┐                            ┌──────┴───────┐
    │             │                            │              │
    ▼             ▼                            ▼              │
┌────────┐  ┌──────────┐                ┌──────────┐        │
│ARCHIVE │  │  DELETE  │                │  RESTORE │        │
│(opt.)  │  │  (soft)  │                │          │        │
│        │  │          │                │• re-open │        │
│• hidden│  │• reverse │                │  record  │        │
│  from  │  │  invty   │                │• re-apply│        │
│  new   │  │  (txns)  │                │  invty   │        │
│  txns  │  │• recycle │                │  (txns)  │        │
│• still │  │  bin     │                │          │        │
│  in    │  └────┬─────┘                └────┬─────┘        │
│  hist  │       │                          │              │
└────────┘       │                          │              │
                 ▼                          │              │
          ┌──────────────┐                  │              │
          │  PERMANENT   │                  │              │
          │  DELETE      │                  │              │
          │  (admin only)│                  │              │
          └──────────────┘                  │              │
                                           └──────────────┘
```

### Archive is a business concept, not a technical one

Archive is only meaningful for entities that become **inactive over time**:

| Entity | Archive? | Why |
|--------|----------|-----|
| Product | ✅ Yes | Discontinued products |
| Contact | ✅ Yes | Inactive customers/suppliers |
| Category | ✅ Yes | Old categories no longer used |
| Sale | ❌ No | You don't archive a transaction |
| Purchase | ❌ No | You don't archive a purchase |
| Stock Adjustment | ❌ No | Immutable once created |
| Payment | ❌ No | Immutable once recorded |

Entities that don't support Archive simply don't implement the `Archivable` interface.

---

## 2. Architecture

```
Controller
    │
    ▼
Business Validation Layer    ← new — reusable validators
    │
    ▼
Lifecycle Policy             ← per-entity, capability-based
    │
    ▼
RecordLifecycleService       ← platform service
    │
    ├── AuditService          ← logs every action
    ├── InventoryService      ← reverses/re-applies stock
    └── DB::transaction()     ← atomic + row locks
```

### Capability-Based Interfaces

Instead of one large interface, entities declare what they support:

```php
interface Archivable
{
    public function canArchive(Model $record): void;
    public function executeArchive(Model $record, User $user): void;
}

interface Deletable
{
    public function canDelete(Model $record): void;
    public function previewImpact(Model $record): array;
    public function executeDelete(Model $record, User $user): void;
}

interface Restorable
{
    public function canRestore(Model $record): void;
    public function executeRestore(Model $record, User $user): void;
}

interface PermanentDeletable
{
    public function canPermanentDelete(Model $record): void;
}
```

Entities implement only what they need:

```php
// Product: can be archived AND deleted (if no transactions)
class ProductPolicy implements Archivable, Deletable { ... }

// Sale: can be deleted (with inventory reversal) and restored
class SalePolicy implements Deletable, Restorable { ... }

// Contact: can be archived, never deleted if has transactions
class ContactPolicy implements Archivable, Deletable { ... }
```

### RecordLifecycleService

Single entry point. The rest of the application never calls `SoftDeletes` directly.

```php
class RecordLifecycleService
{
    public function archive(Model $record, string $reason, User $user): void
    {
        $policy = $this->resolvePolicy($record);          // must implement Archivable
        $policy->canArchive($record);
        $record->archived_at = now();
        $record->archive_reason = $reason;
        $record->archived_by = $user->id;
        $record->save();
        $this->audit->log($user, 'archived', $record, $reason);
    }

    public function delete(Model $record, string $reason, User $user): array
    {
        $policy = $this->resolvePolicy($record);
        $policy->canDelete($record);
        $impact = $policy->previewImpact($record);

        DB::transaction(function () use ($record, $reason, $user, $policy) {
            // Acquire row-level lock on the record and related inventory
            $locked = $record->lockForUpdate();
            $policy->executeDelete($record, $user);
            $record->delete_reason = $reason;
            $record->deleted_by = $user->id;
            $record->save();
            $record->delete();
            $this->audit->log($user, 'deleted', $record, $reason);
        });

        return $impact;
    }

    public function restore(Model $record, User $user): void
    {
        $policy = $this->resolvePolicy($record);
        $policy->canRestore($record);

        DB::transaction(function () use ($record, $user, $policy) {
            $locked = $record->lockForUpdate();
            $record->restore();
            $policy->executeRestore($record, $user);
            $record->delete_reason = null;
            $record->deleted_by = null;
            $record->save();
            $this->audit->log($user, 'restored', $record);
        });
    }

    public function permanentlyDelete(Model $record, User $user): void
    {
        $policy = $this->resolvePolicy($record);
        $policy->canPermanentDelete($record);
        $record->forceDelete();
        $this->audit->log($user, 'permanently_deleted', $record);
    }
}
```

### Transaction Locks (Concurrency Safety)

All lifecycle operations execute inside a database transaction and acquire **row-level locks**:

| Lock Target | Why |
|-------------|-----|
| `Sale::lockForUpdate()` | Prevent concurrent delete + return race |
| `Product::lockForUpdate()` | Prevent concurrent stock changes during reversal |
| `InventoryTransaction` row | Prevent double-reversal |

This prevents:
- Cashier A deleting a Sale while Cashier B creates a Return for the same items
- Two concurrent delete operations on the same record
- Stock reconciliation race conditions

---

## 3. Business Validation Layer

Business rules live **between** the controller and the lifecycle, not inside lifecycle policies.

```
Controller
    │
    ▼
Business Validator        ← NEW — reusable, not coupled to lifecycle
    │  • Will stock go negative?
    │  • Does the user have permission?
    │  • Is the record locked by another process?
    │
    ▼
Lifecycle Policy          ← state transition rules (can it be deleted?)
    │
    ▼
RecordLifecycleService    ← executes the transition
```

```php
class SaleBusinessValidator
{
    public function validateBeforeDelete(Sale $sale): void
    {
        throw_if($sale->returns()->exists(),
            'Cannot delete: a return references this sale.');

        // Check if newer transactions depend on this stock change
        $hasDependents = InventoryTransaction::where('reference', $sale->invoice_number)
            ->where('created_at', '>', $sale->created_at)
            ->exists();

        throw_if($hasDependents,
            'Cannot delete: newer inventory movements depend on this sale.');

        // Check permission
        throw_if(!auth()->user()->can('lifecycle.delete'),
            'You do not have permission to delete sales.');
    }

    public function validateStockImpact(Sale $sale): array
    {
        $negativeItems = [];
        foreach ($sale->items as $item) {
            $product = Product::find($item->product_id);
            $afterRestore = $product->stock_quantity + $item->base_quantity;
            // This validation is for RESTORE, not delete
        }
        return $negativeItems;
    }
}
```

**Why this separation matters:**
- Business validators are reusable across operations (delete, archive, edit)
- Lifecycle policies stay focused on state transitions
- Testing business rules doesn't require lifecycle setup

---

## 4. Lifecycle Policies — Per Entity

### ProductPolicy (Archivable + Deletable)

```php
class ProductPolicy implements Archivable, Deletable
{
    public function canArchive(Product $product): void {}
    // Always allowed — archiving is safe

    public function canDelete(Product $product): void
    {
        throw_if($product->stock_quantity > 0,
            'Cannot delete a product with stock. Archive it instead.');
        throw_if($product->sales()->exists() || $product->purchases()->exists(),
            'Cannot delete a product with transaction history. Archive it instead.');
    }

    public function previewImpact(Product $product): array
    {
        return [
            'inventory' => null,
            'records' => [
                'Product will be moved to the Recycle Bin.',
                'Historical transactions remain unchanged.',
            ],
        ];
    }

    public function executeDelete(Product $product, User $user): void {}
    public function executeArchive(Product $product, User $user): void {}
}
```

### SalePolicy (Deletable + Restorable)

```php
class SalePolicy implements Deletable, Restorable
{
    public function canDelete(Sale $sale): void
    {
        throw_if($sale->trashed(), 'Already deleted.');
        // Dependency checks are in SaleBusinessValidator
    }

    public function previewImpact(Sale $sale): array
    {
        return [
            'inventory' => $sale->items->map(fn($i) => [
                'product' => $i->product_name,
                'added_back' => $i->base_quantity,
            ]),
            'customer_balance' => "Reduced by Rs. " . number_format($sale->grand_total),
            'records' => [
                "Invoice {$sale->invoice_number} moved to Recycle Bin",
                "Payment reversed",
                "Audit log recorded",
            ],
        ];
    }

    public function executeDelete(Sale $sale, User $user): void
    {
        foreach ($sale->items as $item) {
            app(InventoryService::class)->recordAdjustment(
                productId: $item->product_id,
                quantity: $item->base_quantity,
                reference: 'REV-' . $sale->invoice_number,
                notes: "Reversal of deleted sale",
            );
        }
        if ($sale->customer) {
            $sale->customer->decrement('current_balance', $sale->grand_total);
        }
    }

    public function canRestore(Sale $sale): void
    {
        throw_if(!$sale->trashed(), 'Sale is not deleted.');
    }

    public function executeRestore(Sale $sale, User $user): void
    {
        foreach ($sale->items as $item) {
            app(InventoryService::class)->recordAdjustment(
                productId: $item->product_id,
                quantity: -$item->base_quantity,
                reference: 'RESTORE-' . $sale->invoice_number,
                notes: "Restore of deleted sale",
            );
        }
        if ($sale->customer) {
            $sale->customer->increment('current_balance', $sale->grand_total);
        }
    }
}
```

### Registration

```php
// In a ServiceProvider
Lifecycle::register(Product::class, ProductPolicy::class);
Lifecycle::register(Sale::class, SalePolicy::class);
Lifecycle::register(Contact::class, ContactPolicy::class);
```

---

## 5. Business Validation Layer — Examples

```php
// Controller
public function destroy(int $id)
{
    $sale = Sale::findOrFail($id);

    // Step 1: Business validation
    app(SaleBusinessValidator::class)->validateBeforeDelete($sale);

    // Step 2: Lifecycle (impact preview shown before confirm)
    $impact = app(RecordLifecycleService::class)->delete($sale, request('reason'), auth()->user());

    return back()->with('success', 'Sale deleted. Inventory reversed.');
}
```

### What Belongs Where

| Rule | Location | Why |
|------|----------|-----|
| "Product has stock → cannot delete" | `ProductPolicy::canDelete()` | State transition rule |
| "Sale has returns → cannot delete" | `SaleBusinessValidator` | Business rule (reusable across controllers) |
| "User must be manager to delete" | Spatie permission gate | Cross-cutting concern |
| "Will stock go negative?" | `SaleBusinessValidator` | Business rule (checked before confirm dialog) |
| "Record already deleted" | `SalePolicy::canDelete()` | State transition rule |

---

## 6. Archive vs Delete — Detailed Rules

| Entity | Can Archive? | Can Delete? | Blocked If |
|--------|-------------|-------------|------------|
| **Product** | ✅ Always | ✅ If no stock AND no transactions | Has stock or has history → Archive instead |
| **Contact** | ✅ Always | ✅ If no transactions | Has transactions → Archive instead |
| **Category** | ✅ Always | ✅ If no products | Has products → Archive instead |
| **Sale** | ❌ Not applicable | ✅ If no linked returns | Has returns → block |
| **Purchase** | ❌ Not applicable | ✅ If no linked returns | Has returns → block |
| **Stock Adjustment** | ❌ Not applicable | ✅ Always | — |
| **Expense** | ❌ Not applicable | ✅ Always | — |

---

## 7. Recycle Bin

### Location

```
Utilities
├── Backup & Restore
├── Recycle Bin              ← new
├── Audit Log                ← new
├── Data Import
├── Data Export
└── System Health
```

### UX

```
┌──────────────────────────────────────────────┐
│  Recycle Bin                                  │
│                                                │
│  [All Items ▾] [Search...]          []         │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ ☐ INV-1042 · Sale · Rs. 12,000          │  │
│  │   Deleted 2m ago by Admin               │  │
│  │   Reason: Duplicate entry               │  │
│  │   Impact: +50kg Rice, +20kg Sugar       │  │
│  │                         [Restore] [×]   │  │
│  ├──────────────────────────────────────────┤  │
│  │ ☐ AMX-001 · Product · 0 stock           │  │
│  │   Deleted 1h ago by User               │  │
│  │   Reason: No longer sold               │  │
│  │                         [Restore] [×]   │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [Restore Selected]                             │
│                                                │
│  Showing 1-3 of 15 deleted records             │
└──────────────────────────────────────────────┘
```

### Features

| Feature | Behavior |
|---------|----------|
| **Filter by entity** | Products, Sales, Purchases, Contacts, Adjustments |
| **Search** | By name, SKU, invoice number, reason, deleted-by |
| **Bulk restore** | Select multiple → Restore (each goes through its own policy) |
| **Permanent delete** | Admin only. Confirmation + reason required. |
| **Retention** | Indefinite — records stay until permanently deleted. |

### Permissions

| Action | Cashier | Salesman | Manager | Owner | Admin |
|--------|---------|----------|---------|-------|-------|
| View Recycle Bin | ❌ | ❌ | ✅ | ✅ | ✅ |
| Restore | ❌ | ❌ | ✅ | ✅ | ✅ |
| Permanently Delete | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 8. Audit Log

### Table

```sql
CREATE TABLE audit_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NULL,
    event           VARCHAR(100) NOT NULL,          -- "sale.deleted", "product.archived"
    auditable_type  VARCHAR(100) NOT NULL,
    auditable_id    BIGINT UNSIGNED NOT NULL,
    description     TEXT NULL,
    old_values      JSON NULL,
    new_values      JSON NULL,
    reason          VARCHAR(500) NULL,
    ip_address      VARCHAR(45) NULL,
    created_at      TIMESTAMP,
    INDEX (event),
    INDEX (auditable_type, auditable_id)
);
```

---

## 9. Phased Implementation Plan

| Phase | What | Key Files | Effort |
|-------|------|-----------|--------|
| **P1** | Interfaces + `RecordLifecycleService` + `AuditService` | `app/Services/Lifecycle/` | Small |
| **P2** | `ProductPolicy` + `ContactPolicy` + `SalePolicy` + `PurchasePolicy` | `app/Policies/Lifecycle/` | Medium |
| **P3** | Business Validators (Sale, Purchase, Product) | `app/Validators/` | Small |
| **P4** | Recycle Bin UI + API | Controller + React page | Medium |
| **P5** | Audit Log UI | Controller + React page | Medium |
| **P6** | Impact preview dialogs on delete buttons | Frontend components | Medium |
| **P7** | Permission gates + concurrency tests | Spatie + tests | Small |

---

## 10. Final Recommendation

**Adopt the Data Lifecycle Framework as a platform-level capability.**

| Component | What It Provides |
|-----------|-----------------|
| **Capability interfaces** | `Archivable`, `Deletable`, `Restorable` — entities declare what they need |
| **RecordLifecycleService** | Single entry point for all lifecycle actions |
| **Business Validators** | Reusable rules, separate from lifecycle |
| **AuditService** | Logs every action with user, reason, state |
| **Recycle Bin** | Restore without database access |
| **Impact Preview** | Shows exact effects before confirmation |
| **Transaction locks** | Prevents concurrency race conditions |
| **Permission Layer** | Spatie gates on every action |

**Every future module** — Warehouses, Manufacturing, CRM, Documents — simply implements the capability interfaces it needs and registers its policy. The lifecycle framework handles the rest.
