# Payment Lifecycle Audit Report

**Project:** invenos-backend
**Date:** 2026-07-29
**Scope:** Payment module lifecycle compliance, contact balance integrity, and architectural consistency

---

## Executive Summary

The payment module has **three critical/high-severity bugs** where contact balances are not properly maintained during payment creation and deletion. The `FinancialTransaction` model is not registered in the lifecycle system, and there is no mechanism to reverse contact balance changes when a payment is deleted. Additionally, `recordCustomerPayment` and `recordSupplierPayment` create FinancialTransaction records without updating the contact's `current_balance`, creating a silent desync between transaction records and contact balances.

---

## Bug Findings

### BUG-1 (CRITICAL): `PaymentController::destroy()` does not reverse contact balance

**File:** `app/Http/Controllers/PaymentController.php`, lines 124-132

**Description:**
The `destroy()` method deletes a FinancialTransaction record but never restores the contact's `current_balance`. The `store()` method (line 107) correctly decrements the balance by the payment amount via `$contact->decrement('current_balance', $data['amount'])`. When that payment is later deleted, the balance must be incremented back — but this step is missing entirely.

```php
// Current code (broken):
public function destroy(int $id): RedirectResponse
{
    $this->authorize('lifecycle.permanent-delete');
    $transaction = FinancialTransaction::findOrFail($id);
    $transaction->delete();  // BUG: contact balance not restored
    return back()->with('success', 'Payment deleted.');
}
```

**Impact:**
Every deleted payment permanently reduces the contact's `current_balance` below its true value. Over time, contact balances drift downward, making the ledger unreliable.

**Severity:** Critical — data integrity violation, balances become permanently incorrect.

**Fix:**
Restore the contact balance before deleting the transaction. The direction logic in `store()` decrements for both `in` and `out` (see BUG-4 notes), so the reverse must increment for both:
```php
public function destroy(int $id): RedirectResponse
{
    $this->authorize('lifecycle.permanent-delete');

    $transaction = FinancialTransaction::with('contact')->findOrFail($id);

    \Illuminate\Support\Facades\DB::transaction(function () use ($transaction) {
        if ($transaction->contact) {
            $transaction->contact->increment('current_balance', $transaction->amount);
        }
        $transaction->delete();
    });

    return back()->with('success', 'Payment deleted.');
}
```

---

### BUG-2 (HIGH): `recordCustomerPayment()` does not update contact balance

**File:** `app/Domains/Payments/Services/PaymentService.php`, lines 58-85

**Description:**
When `recordCustomerPayment()` is called (via the `payments.customer.store` route), it updates the Sale's `amount_paid`, `outstanding_balance`, and `payment_status`, and creates a FinancialTransaction. However, it never decrements the customer's `current_balance`.

Trace the balance lifecycle:
1. `SaleService::create()` (line 154): increments `customer->current_balance` by `grand_total` — customer owes this amount.
2. `recordCustomerPayment()`: should decrement `current_balance` by the payment amount (customer paid, so they owe less) — **this step is missing**.
3. Result: The customer's balance remains inflated even after they have paid.

**Impact:**
Contact balance shows more outstanding than is actually owed. The payments index page and contact ledger will disagree with the actual state of affairs.

**Severity:** High — incorrect financial reporting, shows inaccurate outstanding balances.

**Fix:**
Add contact balance decrement inside `recordCustomerPayment()`:
```php
public function recordCustomerPayment(RecordPaymentData $data): array
{
    $sale = Sale::findOrFail($data->transactionId);
    if ($sale->payment_status === 'paid') {
        throw new \RuntimeException('Sale is already fully paid.');
    }
    $remaining = $sale->grand_total - $sale->amount_paid;
    if ($data->amount > $remaining) {
        throw new \RuntimeException("Payment of {$data->amount} exceeds remaining balance of {$remaining}.");
    }
    $newPaid = $sale->amount_paid + $data->amount;
    $newOutstanding = $sale->grand_total - $newPaid;
    $sale->update([
        'amount_paid' => $newPaid,
        'outstanding_balance' => $newOutstanding,
        'payment_status' => $newOutstanding <= 0 ? 'paid' : 'partial',
    ]);

    // NEW: Update customer balance
    if ($sale->customer) {
        $sale->customer->decrement('current_balance', $data->amount);
    }

    $ft = FinancialTransaction::create([...]);
    return ['transaction' => $ft, 'sale' => $sale->fresh()];
}
```

---

### BUG-3 (HIGH): `recordSupplierPayment()` does not update contact balance

**File:** `app/Domains/Payments/Services/PaymentService.php`, lines 87-114

**Description:**
Identical to BUG-2 but for supplier payments. When a payment is recorded against a purchase bill (via the `payments.supplier.store` route), the supplier's `current_balance` is not decremented.

Trace:
1. `PurchaseService::create()` (line 133): increments `supplier->current_balance` by `total_amount` — we owe this amount.
2. `recordSupplierPayment()`: should decrement `current_balance` by the payment amount (we paid, so we owe less) — **this step is missing**.

**Severity:** High — same as BUG-2, supplier payable balances show inflated amounts.

**Fix:**
Add contact balance decrement inside `recordSupplierPayment()`:
```php
public function recordSupplierPayment(RecordPaymentData $data): array
{
    $bill = PurchaseBill::findOrFail($data->transactionId);
    // ... existing validation ...

    // NEW: Update supplier balance
    if ($bill->supplier) {
        $bill->supplier->decrement('current_balance', $data->amount);
    }

    $ft = FinancialTransaction::create([...]);
    return ['transaction' => $ft, 'purchase' => $bill->fresh()];
}
```

---

### BUG-4 (MEDIUM): `destroy()` bypasses RecordLifecycleService — no audit trail

**File:** `app/Http/Controllers/PaymentController.php`, lines 124-132

**Description:**
The `destroy()` method applies the `lifecycle.permanent-delete` gate (admin-only) but calls `$transaction->delete()` directly instead of routing through `$this->lifecycle->permanentlyDelete()`. This means:
- No audit log entry is created for the deletion event.
- No impact preview is shown to the user before deletion.
- If `FinancialTransaction` ever adopts `SoftDeletes`, this would be a soft delete rather than permanent, contradicting the gate name.

The RecycleBinController (line 137) uses the same gate correctly:
```php
$this->lifecycle->permanentlyDelete($record, auth()->user());
```

**Severity:** Medium — missing audit trail for financial deletions.

**Fix:**
Inject `RecordLifecycleService` and route through it:
```php
public function __construct(
    private readonly PaymentService $paymentService,
    private readonly \App\Services\Lifecycle\RecordLifecycleService $lifecycle,
) {}

public function destroy(int $id): RedirectResponse
{
    $this->authorize('lifecycle.permanent-delete');

    $transaction = FinancialTransaction::with('contact')->findOrFail($id);

    // Reverse contact balance before permanent delete
    \Illuminate\Support\Facades\DB::transaction(function () use ($transaction) {
        if ($transaction->contact) {
            $transaction->contact->increment('current_balance', $transaction->amount);
        }
        $this->lifecycle->permanentlyDelete($transaction, auth()->user());
    });

    return back()->with('success', 'Payment deleted.');
}
```

However, since `RecordLifecycleService::permanentlyDelete()` calls `forceDelete()` which requires `SoftDeletes`, and `FinancialTransaction` does **not** use `SoftDeletes`, this call would fail with a different error. Two options:
1. Add `SoftDeletes` to `FinancialTransaction` and register it in the lifecycle system (see RECOMMENDATION-2).
2. Keep the direct `$transaction->delete()` call but manually audit-log the event.

Option 1 is preferred for consistency with the rest of the application.

---

### BUG-5 (MEDIUM): `FinancialTransaction` not registered in RecordLifecycleService

**File:** `app/Providers/LifecycleServiceProvider.php`, lines 29-32

**Description:**
The `LifecycleServiceProvider::boot()` method registers four models:
- `Product::class`
- `Contact::class`
- `Sale::class`
- `PurchaseBill::class`

`FinancialTransaction::class` is **not** registered. This means:
- The `destroy()` method cannot use `$this->lifecycle->permanentlyDelete()` even if it wanted to (it would throw `"No lifecycle policy registered"`).
- No audit log entries are created when payments are deleted.
- Inconsistent with the application's own lifecycle architecture.

**Severity:** Medium — missing lifecycle integration for a financial entity.

**Fix:**
Register `FinancialTransaction` in the lifecycle system:
1. Create `app/Policies/Lifecycle/FinancialTransactionPolicy.php` implementing `PermanentDeletable`.
2. Register it in `LifecycleServiceProvider::boot()`:
```php
$lifecycle->register(FinancialTransaction::class, FinancialTransactionPolicy::class);
```

---

### BUG-6 (MEDIUM): `FinancialTransaction` has no `linked_purchase_id` column

**File:** `database/migrations/2026_07_25_204234_create_financial_transactions_table.php`
**File:** `app/Domains/Payments/Services/PaymentService.php`, line 104

**Description:**
The `financial_transactions` table has a `linked_sale_id` foreign key to the `sales` table, but no equivalent `linked_purchase_id` foreign key to `purchase_bills`. The `recordSupplierPayment()` method creates a FinancialTransaction with direction `out` and type `payout` but provides no foreign key link back to the purchase bill:

```php
$ft = FinancialTransaction::create([
    'contact_id' => $bill->supplier_id,
    'direction' => 'out', 'type' => 'payout',
    // ... no linked_purchase_id
]);
```

This makes it impossible to:
- Trace a supplier payment back to its purchase bill from the transaction alone.
- Cascade-delete related payments when a purchase bill is deleted.

Meanwhile, `recordCustomerPayment()` correctly sets `linked_sale_id => $sale->id`.

**Severity:** Medium — missing referential traceability for supplier payments.

**Fix:**
Either:
1. Add a `linked_purchase_id` column to the migration and model, or
2. Store the purchase bill ID in the `reference` or `description` field as a workaround.

---

### BUG-7 (LOW): `store()` validation does not constrain payment method to valid enum values

**File:** `app/Http/Controllers/PaymentController.php`, line 82

**Description:**
The `store()` method validates `method` as `'required|string'` but the database column is an enum restricted to `['cash', 'card', 'transfer', 'easypaisa', 'jazzcash']`. Passing an invalid method will trigger a database-level constraint violation rather than returning a clean validation error. The same applies to `storeCustomerPayment()` (line 54) and `storeSupplierPayment()` (line 68).

**Severity:** Low — edge case, the frontend controls the input.

**Fix:**
Add an `in` validation rule:
```php
'method' => 'required|string|in:cash,card,transfer,easypaisa,jazzcash',
```

---

### BUG-8 (LOW): `RecordPaymentData::fromRequest` has unreachable default for `method`

**File:** `app/Domains/Payments/DTOs/RecordPaymentData.php`, line 22

**Description:**
The `fromRequest()` method has `method: $data['method'] ?? 'cash'` as a fallback default. However, the validation rules in both `storeCustomerPayment()` and `storeSupplierPayment()` require `method` as a required field. This means the `?? 'cash'` branch is never taken — validated data will always have `method`. This is harmless but creates a misleading impression of an optional field.

**Severity:** Low — no runtime impact.

**Fix:** Remove the default or keep it as a safety net.

---

## Architectural Observations

### OBSERVATION-1: Two competing delete paths for Sales and Purchases

The codebase has two distinct mechanisms for deleting sales and purchases:

| Path | Controller | Mechanism |
|------|-----------|-----------|
| **Lifecycle path** | `SaleController::destroy()`, `PurchaseController::destroy()` | `RecordLifecycleService::delete()` + Policy |
| **Direct path** | `SaleService::delete()`, `PurchaseService::delete()` | Direct service method |

Both paths implement their own balance-reversal and inventory-reversal logic, but with subtle differences:
- `SalePolicy::executeDelete()` uses `decrement()` (no floor), while `SaleService::delete()` uses `max(0, ...)` clamping.
- `PurchasePolicy::executeDelete()` uses `max(0, ...)` clamping via calculated assignment, while `PurchaseService::delete()` also uses `max(0, ...)` clamping.

The controllers (`SaleController`, `PurchaseController`) use the lifecycle path, so the `SaleService::delete()` and `PurchaseService::delete()` methods may be dead code. If they are, they should be removed to prevent confusion.

### OBSERVATION-2: `SaleService` does not create an invoice FinancialTransaction

`PurchaseService::create()` (line 136) creates a FinancialTransaction with type `'invoice'` for the purchase total. However, `SaleService::create()` does **not** create a corresponding `'invoice'` transaction for the sale. This creates an asymmetry:
- A purchase creates both: (a) supplier balance increment, (b) FinancialTransaction (type=invoice)
- A sale creates only: (a) customer balance increment, (b) no FinancialTransaction

If a financial report ever relies on FinancialTransaction records with type `'invoice'`, sales will be invisible.

### OBSERVATION-3: `current_balance` is a cached/derived field with no self-healing

The `Contact.current_balance` field is updated manually throughout the codebase:
- Sale creation (increment)
- Sale deletion (decrement/clamp)
- Purchase creation (increment)
- Purchase deletion (decrement/clamp)
- Payment creation (decrement)

There is no mechanism to recompute `current_balance` from source FinancialTransaction records. If any update path is missed (as shown by BUG-1, BUG-2, BUG-3), the balance drifts permanently. A `recalculateBalance()` method or Artisan command should be added.

---

## Recommendations

### RECOMMENDATION-1: Fix all balance bugs immediately

Apply the fixes described in BUG-1, BUG-2, and BUG-3 as a single coordinated change. These bugs are the highest risk because they silently corrupt financial data.

### RECOMMENDATION-2: Register FinancialTransaction in the lifecycle system

Create `app/Policies/Lifecycle/FinancialTransactionPolicy.php`:
```php
<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\PermanentDeletable;
use Illuminate\Database\Eloquent\Model;

class FinancialTransactionPolicy implements PermanentDeletable
{
    public function canPermanentDelete(Model $record): void
    {
        // Admin-only gate already applied in controller
    }
}
```

Register in `LifecycleServiceProvider::boot()`:
```php
$lifecycle->register(FinancialTransaction::class, FinancialTransactionPolicy::class);
```

Add `SoftDeletes` to the `FinancialTransaction` model if needed for lifecycle integration.

### RECOMMENDATION-3: Add `linked_purchase_id` to FinancialTransaction

Add a migration and model relationship so supplier payments can be traced back to purchase bills, symmetric with `linked_sale_id`.

### RECOMMENDATION-4: Add a `recalculateBalance` Artisan command

Create a command that recomputes `Contact.current_balance` from FinancialTransaction records to self-heal any drift:
```php
$contacts = Contact::all();
foreach ($contacts as $contact) {
    $transactions = FinancialTransaction::where('contact_id', $contact->id);
    $balance = $contact->opening_balance;
    foreach ($transactions as $txn) {
        // Apply balance logic based on type and direction
    }
    $contact->current_balance = $balance;
    $contact->save();
}
```

### RECOMMENDATION-5: Standardize balance clamping behavior

Decide whether balance values can go negative (overpayment creates credit balance) or are clamped at zero. Currently:
- Some paths clamp at `max(0, ...)`
- Some paths use raw `decrement()`/`increment()`

Pick one convention and apply it everywhere, or use `decrement()` consistently without clamping (more permissive, allows credit balances).

### RECOMMENDATION-6: Remove dead code paths

If `SaleService::delete()` and `PurchaseService::delete()` are no longer called anywhere (all controllers use the lifecycle path), remove them to eliminate maintenance burden.

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `app/Http/Controllers/PaymentController.php` | Payment CRUD controller |
| `app/Domains/Payments/Services/PaymentService.php` | Payment search, customer/supplier payment recording |
| `app/Domains/Payments/DTOs/RecordPaymentData.php` | Payment data transfer object |
| `app/Models/FinancialTransaction.php` | FinancialTransaction Eloquent model |
| `app/Models/Contact.php` | Contact model with `current_balance` |
| `app/Models/Sale.php` | Sale model |
| `app/Models/PurchaseBill.php` | Purchase bill model |
| `app/Services/Lifecycle/RecordLifecycleService.php` | Lifecycle management service |
| `app/Services/Lifecycle/AuditService.php` | Audit trail service |
| `app/Providers/LifecycleServiceProvider.php` | Lifecycle entity registrations |
| `app/Providers/AppServiceProvider.php` | Gate definitions including `lifecycle.permanent-delete` |
| `app/Http/Controllers/RecycleBinController.php` | Recycle bin lifecycle controller |
| `app/Http/Controllers/ExpenseController.php` | Expense controller (check for similar bugs) |
| `app/Policies/Lifecycle/SalePolicy.php` | Sale lifecycle policy |
| `app/Policies/Lifecycle/PurchasePolicy.php` | Purchase lifecycle policy |
| `app/Policies/Lifecycle/ContactPolicy.php` | Contact lifecycle policy |
| `app/Domains/Sales/Services/SaleService.php` | Sale creation/deletion service |
| `app/Domains/Purchasing/Services/PurchaseService.php` | Purchase creation/deletion service |
| `database/migrations/2026_07_25_204234_create_financial_transactions_table.php` | Financial transactions schema |
| `routes/web.php` (lines 81-87) | Payment route definitions |
| `app/Contracts/Lifecycle/Archivable.php` | Lifecycle contract |
| `app/Contracts/Lifecycle/Deletable.php` | Lifecycle contract |
| `app/Contracts/Lifecycle/Restorable.php` | Lifecycle contract |
| `app/Contracts/Lifecycle/PermanentDeletable.php` | Lifecycle contract |
