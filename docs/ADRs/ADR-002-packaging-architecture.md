# ADR-002: Packaging Architecture — Option A (Separated Concerns)

**Status:** Approved  
**Date:** 2026-07-28  
**Deciders:** Architecture Review Board  
**Replaces:** ADR-001 (superseded — earlier packaging discussions)  

---

## Context

The product module needs to support multi-level packaging (e.g., Box → 12 Pack → 10 Capsule) while maintaining clean separation between structural packaging relationships and business selling-unit configuration.

Two architectures were evaluated:

- **Option A (Separated):** `product_packaging` table for structural relationships + `selling_units` table for business entities, linked by a nullable `packaging_id` FK.
- **Option B (Hierarchical):** Single `selling_units` table with `parent_id` self-join, eliminating the packaging table.

A 12-dimension comparative analysis was conducted. Full analysis in `docs/packaging-architecture-comparison.md`.

---

## Decision

**Adopt Option A: `product_packaging` + `selling_units` with `packaging_id` FK.**

### Schema

```sql
-- Unit name registry (stable identifiers, no string matching)
CREATE TABLE product_units (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL UNIQUE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packaging structure (relationships between units, per product)
CREATE TABLE product_packaging (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id        BIGINT UNSIGNED NOT NULL,
    container_unit_id BIGINT UNSIGNED NOT NULL,
    contains_unit_id  BIGINT UNSIGNED NOT NULL,
    quantity          DECIMAL(12,4) NOT NULL,
    level             TINYINT UNSIGNED NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (container_unit_id) REFERENCES product_units(id),
    FOREIGN KEY (contains_unit_id) REFERENCES product_units(id)
);

-- selling_units gains a nullable packaging_id (replaces is_derived boolean)
ALTER TABLE selling_units ADD COLUMN packaging_id BIGINT UNSIGNED NULL
    FOREIGN KEY REFERENCES product_packaging(id) ON DELETE SET NULL;
```

### Rejected

- **Option B (`selling_units.parent_id` self-join):** Rejected because it conflates structural relationships with business configuration in a single table, creating ambiguous column semantics, cross-context editing risks, and a larger regression surface. The only advantage (no derivation engine) is negligible — both designs complete in <0.1ms per product for real-world hierarchy depths.
- **String-name matching** (`container_name`/`contains_name` as plain strings): Rejected because it introduces case-sensitivity, pluralization, abbreviation, and localization risks. `product_units` with FK references solves this without circular dependencies.
- **`is_derived` boolean:** Rejected. The `packaging_id` FK (nullable) inherently encodes whether a selling unit was generated from packaging, and is more expressive (it also identifies which packaging row generated it).

---

## Component Ownership

| Component | Owns | Does Not Own |
|-----------|------|-------------|
| **`product_packaging`** | Packaging relationships, conversion structure, hierarchy levels | Prices, barcodes, SKUs, POS visibility, defaults |
| **`selling_units`** | Prices, barcodes, SKUs, POS visibility, defaults, display order, tax behaviour | Packaging hierarchy, conversion factors |
| **`product_units`** | Unit name registry (stable identifiers) | Product-specific relationships, conversions |
| **Inventory** | Base-unit stock quantities only | Selling units, packaging structure |
| **Purchase** | Supplier packaging snapshots (`purchase_bill_items`) | Product-level packaging defaults |
| **Sale** | Selling-unit snapshots (`sale_items`) | Current packaging structure |

---

## Derivation Engine Lifecycle

### One-Way Flow (Enforced)

```
product_packaging
       │
       ▼
Derivation Engine  ──►  selling_units
```

**The reverse is forbidden.** Changes to `selling_units` (prices, barcodes, POS visibility) must never propagate back to `product_packaging`. The derivation engine is the only bridge, and it flows in one direction only.

### When the Derivation Engine Runs

| Event | Trigger | Behaviour |
|-------|---------|-----------|
| **Product Created** | After product + packaging saved, before transaction commits | Generate `selling_units` for each unit in the packaging graph. Quantity is derived from graph walk. Prices default to 0, barcodes to null, POS visibility to enabled. |
| **Packaging Levels Edited** | User adds, removes, reorders, or changes quantity on `product_packaging` rows | Re-derive affected `selling_units`. Update quantities. Preserve any user-set fields (price, barcode, SKU, is_default, POS visibility). Remove selling units that no longer correspond to any packaging level (auto-delete if never customized; detach if customized). |
| **Packaging Row Deleted** | User removes a packaging level | If the corresponding `selling_units` row has `packaging_id` matching the deleted row AND no customizations → auto-delete. If customized → set `packaging_id = NULL` (becomes a standalone custom selling unit). |

### When the Derivation Engine Does NOT Run

| Context | Why |
|---------|-----|
| **Sale creation** | Uses existing `selling_units` rows. Derivation is write-time only. |
| **Purchase creation** | Uses purchase-bill-specific pack data, not product-level packaging. |
| **POS unit dropdown** | Reads `selling_units` directly. No derivation needed. |
| **Report generation** | Reads historical snapshots. |
| **Price/barcode/visibility edit** | User editing a selling unit's business fields. Derivation engine does not run because `product_packaging` hasn't changed. |
| **Any read path** | The derivation result is materialised at write time. Reads are flat queries. |

---

## Selling Unit Lifecycle

### State Diagram

```
                        ┌──────────────┐
                        │  Product     │
                        │  Created     │
                        └──────┬───────┘
                               │
                               ▼
                     ┌─────────────────┐
                     │   GENERATED     │ ◄──── Derivation engine creates
                     │                 │        selling_units from packaging
                     │ qty = derived   │        structure. All business
                     │ price = 0       │        fields at defaults.
                     │ barcode = null  │
                     │ packaging_id=X  │
                     └───┬─────────┬───┘
                         │         │
                ┌────────┘         └────────┐
                ▼                            ▼
     ┌──────────────────┐         ┌──────────────────┐
     │   CUSTOMIZED     │         │    DELETED       │
     │                  │         │                  │
     │ qty = derived    │         │ Packaging level  │
     │ price = USER     │         │ removed AND      │
     │ barcode = USER   │         │ no customizations│
     │ packaging_id=X   │         │ → auto-delete    │
     └───┬──────────────┘         └──────────────────┘
         │
         │  packaging level removed
         ▼
     ┌──────────────────┐
     │   STANDALONE     │
     │                  │
     │ qty = frozen     │
     │ price = USER     │
     │ barcode = USER   │
     │ packaging_id=NULL│
     │                  │
     │ Kept because it  │
     │ had custom data  │
     └──────────────────┘

Also: ANY state can transition to:

     ┌──────────────────┐
     │   ARCHIVED       │
     │                  │
     │ User hides from  │
     │ POS (visibility  │
     │ = false). Data   │
     │ preserved. Can   │
     │ be restored.     │
     └──────────────────┘
```

There are four persistent states. Reconciliation (re-attaching a standalone selling unit to a new packaging relationship) is a **transient operation**, not a persistent state — see the reattachment note below the transition table.

### State Transition Rules

| From | To | Trigger | Auto-changes | Preserved | User confirmation needed? |
|------|----|---------|-------------|-----------|--------------------------|
| — | **Generated** | Product created with packaging | Quantity derived from graph. Price=0, barcode=null | — | No |
| **Generated** | **Customized** | User sets price, barcode, SKU, or POS visibility | None | All user-set fields survive future derivation runs | No |
| **Generated** | **Deleted** | Packaging level removed, no customizations | Row deleted | Nothing to preserve | No (implied by removing packaging) |
| **Customized** | **Standalone** | Packaging level removed, has customizations | `packaging_id` set to NULL. Quantity frozen at last derived value (see note below) | Price, barcode, SKU, visibility | Informational: "Pack will be kept as a custom selling unit with its current price." |
| **Standalone** | — | User deletes it | Row deleted | — | Yes: "Delete this custom selling unit?" |
| **Any** | **Archived** | User disables POS visibility | `pos_visible = false` | All fields | No |
| **Archived** | **Any** | User re-enables | `pos_visible = true` | All fields | No |

**Standalone reattachment:** A standalone selling unit may be re-attached to a packaging relationship through explicit user action (e.g., selecting "link to packaging level" in the UI). This is a **transient operation**, not a persistent state. On reattachment, `packaging_id` is set, `quantity` is updated to match the packaging graph, and all user-set fields (price, barcode, SKU, visibility) are preserved. The unit is now **Generated** or **Customized**, depending on whether the user had previously modified business fields.

Reattachment is **never automatic** — it must always be an intentional user action. Deleting and re-creating a packaging level with the same unit name does NOT re-attach; it creates a new Generated selling unit. This prevents subtle bugs where a renamed or replaced packaging level silently reattaches to a customized selling unit that the user intended to keep separate.

### Frozen Quantity — Why

Once a customized selling unit becomes **Standalone**, it is no longer governed by the packaging structure. Its conversion factor (`quantity`) is frozen — set to the last value the derivation engine computed before detachment — and becomes an explicit user-managed field.

The reasoning: a standalone unit must still function in the POS. If a customer buys 2 "Packs" (now a custom unit), the system needs to know how many base units to deduct. The frozen quantity provides that conversion. If the user wants a different quantity, they edit it directly — the derivation engine will never touch it again unless the unit is intentionally reattached to a packaging level.

This is consistent with the ownership model: the derivation engine governs `quantity` only for units with a `packaging_id`. Standalone units own their own quantity.

---

## Architectural Invariants

The following invariants must never be violated. They serve as the authoritative reference for code review and system design.

### Structural Invariants

| # | Invariant | Rationale |
|---|-----------|-----------|
| 1 | `product_packaging` is the **only** owner of packaging relationships. | No other table or service may define or override "X contains Y × Z." |
| 2 | `selling_units` never modifies `product_packaging`. | The dependency is one-way: packaging → selling units. No reverse sync. |
| 3 | The derivation engine only runs on **write operations** (product create, packaging edit, packaging delete). | Runtime operations (sale, purchase, report, POS) never derive packaging. |
| 4 | Inventory is always tracked in **base units** only. | No selling-unit quantity or packaging quantity is ever stored in `inventory_transactions` as authoritative stock data. |
| 5 | Historical transactions always rely on **snapshotted data**, never the current packaging structure. | `sale_items`, `purchase_bill_items`, and `inventory_transactions` contain immutable copies of relevant fields at transaction time. |
| 6 | Supplier packaging is **purchase-specific** and never stored in `product_packaging`. | Supplier packs vary per purchase and per supplier. `product_packaging` is for retail packaging only. |

### Data Integrity Invariants

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 7 | A selling unit with a non-null `packaging_id` must have its `quantity` derived from the packaging graph. | Derivation engine sets this; user edits to `quantity` on derived units are overwritten by the next derivation run. |
| 8 | A selling unit with a null `packaging_id` (standalone) owns its own `quantity`. | Derivation engine never touches rows with null `packaging_id`. |
| 9 | Deleting a `product_packaging` row must never delete a customized selling unit. | FK is `ON DELETE SET NULL`, not `CASCADE`. Customized units become standalone. |
| 10 | Every selling unit must always have a valid positive `quantity` for base-unit conversion. | Both derivation engine and standalone editing must enforce `quantity > 0`. |

### Behavioural Invariants

| # | Invariant | Rationale |
|---|-----------|-----------|
| 11 | `product_packaging` changes must never retroactively change historical financial or inventory records. | Historical data is immutable. Packaging changes only affect future transactions. |
| 12 | The POS, Purchase, and Reports modules must never invoke the derivation engine. | They read the materialised `selling_units` table. Derivation is a write-time concern. |
| 13 | A deleted and re-created packaging level is treated as a **new structure**, not a reconciliation. | Reattachment by identity (unit name or otherwise) creates subtle bugs on rename. Reattachment must always be an explicit user action. |

---

## Migration Strategy

| Step | Action | Risk |
|------|--------|------|
| 1 | Create `product_units` table + seed with common units | None (new table) |
| 2 | Create `product_packaging` table | None (new table) |
| 3 | Add `packaging_id` to `selling_units` (nullable, FK to `product_packaging.id`) | None (nullable, no existing data affected) |
| 4 | Build derivation engine (backend service) | New code, no existing paths affected |
| 5 | Build UnitAutocomplete component | New frontend component |
| 6 | Build PackagingLevelsBuilder component | New frontend component |
| 7 | Integrate into CreateProduct (Quick Entry mode) | New UI path; old path still works |
| 8 | Integrate into EditProduct | Same |
| 9 | **No backfill** — existing products are untouched | Deliberate: existing products continue using the legacy model until they are edited. This means the system supports **two generations of products** during the transition. All code paths must handle both legacy products (no `product_packaging` rows, `packaging_id` is null) and new products (with packaging). |
| 10 | Rollback: drop `product_packaging`, drop `packaging_id`, delete engine code | Safe — existing data was never migrated |

---

## Consequences

### Positive
- Clear separation of concerns — packaging structure and selling configuration evolve independently
- Stable identifiers (`product_units.id`) eliminate string-matching risks
- `packaging_id` FK is more expressive than `is_derived` boolean
- Write-time materialisation means reads are simple flat queries
- Migration adds tables but doesn't require backfill or change existing code paths

### Negative
- Derivation engine is new code (~60-80 lines) that Option B would not need
- One additional join through `product_units` on lookups (negligible cost)
- The `packaging_id` column on `selling_units` represents a semantic dependency between two tables that must be documented

### Risks
- **Derivation engine becomes "smart":** Guard against reverse flow (`selling_units → product_packaging`). Enforce one-way dependency in code review.
- **Runtime derivation creep:** Guard against developers calling derivation on read paths. Derivation is write-time only.
- **Divergent quantities:** If a selling unit's `quantity` is manually edited AND packaging changes, the derivation engine will overwrite it. This is correct behaviour — the quantity represents the conversion factor, which is owned by the packaging structure. Custom fields (price, barcode, SKU, visibility) are never overwritten.
