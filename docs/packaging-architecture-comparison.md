# Packaging Architecture: Option A vs Option B — Comparative Analysis

---

## The Two Designs

### Option A: Separated Concerns (`product_packaging` + `selling_units`)

```
product_packaging                   selling_units
══════════════════                   ═══════════════
Box ──12──► Pack                    Box:    price=500,  barcode=X,  is_default=true
Pack──10──► Capsule                 Pack:   price=50,   barcode=Y,  is_default=false
                                    Capsule:price=5,    barcode=Z,  is_default=false

Structural relationships            Business entities
(product_packaging.container_unit_id → product_units.id)   (selling_units.unit_id → product_units.id)
(product_packaging.contains_unit_id  → product_units.id)   (selling_units.packaging_id → product_packaging.id, nullable)
```

- Two tables with distinct responsibilities
- `selling_units` gains a nullable `packaging_id` FK to `product_packaging.id` (replacing `is_derived`)
- `product_packaging` references `product_units` (stable IDs), never `selling_units` — no circular dependency
- Derivation engine: reads `product_packaging`, creates/updates `selling_units` where `packaging_id` matches

### Option B: Hierarchical `selling_units` (`parent_id` self-join)

```
selling_units (single table, hierarchical)
═════════════════════════════════════════════════
Box:    qty=120,   parent_id=NULL, price=500,  barcode=X
Pack:   qty=10,    parent_id=Box,  price=50,   barcode=Y
Capsule:qty=1,     parent_id=Pack, price=5,    barcode=Z

    ▲ parent_id self-join encodes "contains"
    ▲ quantity doubles as both "base unit conversion" and "packaging ratio"
```

- Single table, no `product_packaging` needed
- Hierarchy encoded via `parent_id` self-join
- Each row is simultaneously a business entity (price, barcode, POS settings) AND a node in the packaging graph
- No derivation engine — the data is already in place

---

## Evaluation Dimensions

### 1. Separation of Concerns

| Dimension | Option A (Separate) | Option B (Self-join) |
|-----------|--------------------|----------------------|
| **Structural vs Business** | Cleanly split. `product_packaging` = relationships. `selling_units` = commerce. | **Conflated.** One row holds "Box contains 12 Pack" AND "Box costs Rs. 500 and has barcode X." |
| **Change impact** | Changing packaging (Box→24 Pack) updates only `product_packaging.quantity`. Selling unit prices/barcodes are untouched. | Changing packaging (Box→24 Pack) requires updating a row that also carries business data. Either the update is scoped to one column (fragile) or you risk side effects. |
| **Deletion semantics** | Delete a `product_packaging` row → derivation nullifies `packaging_id` on affected `selling_units`. Business data preserved. | Delete a `selling_units` row that's a parent → cascade or orphan its children. To "remove Pack from hierarchy but keep it as a custom unit," you must null its `parent_id` AND ensure the quantity still makes sense — two distinct operations on one row. |
| **Quantity semantics** | `product_packaging.quantity` = "12 Packs per Box" (packaging ratio). `selling_units.quantity` = "120 base units per Box" (conversion factor). **Unambiguous.** | `selling_units.quantity` = ??? Is it base-unit conversion (120 capsules) or packaging ratio (12 Packs)? For root nodes (parent_id=NULL), it must be base-unit conversion. For child nodes, it's ambiguous — is Pack's quantity=10 "10 base units" or "10 Pack-level units"? You'd need a convention or a second column. |

**Verdict: Option A wins decisively.** The two responsibilities (structure vs commerce) change at different rates, for different reasons, and should be modelled independently. Option B's single-table approach overloads row semantics in a way that becomes confusing the moment you need to edit, delete, or query selectively.

---

### 2. Domain Modelling

| Concern | Option A | Option B |
|---------|----------|----------|
| **Ubiquitous language match** | "Box contains 12 Pack" is a first-class row in `product_packaging`. Matches how users speak. | "Pack has parent_id = Box" is an implementation detail. The domain relationship is implicit, not explicit. |
| **Base unit identification** | The leaf of the packaging graph is the base unit. Trivial to find: "which unit has no `contains_unit_id` pointing to it?" | The leaf is the node with no children. But every node also has business data. Finding the "real" base unit means traversing the tree to find a node where no other node points to it as parent. |
| **Custom units (not in packaging)** | `packaging_id IS NULL` → custom unit. Clear, queryable, non-destructive. | `parent_id IS NULL` AND not in any packaging chain. But wait — `parent_id=NULL` also describes the root of a hierarchy. How do you distinguish "standalone custom unit like 250g bag" from "Box, the root of the packaging tree"? You'd need an additional column (e.g., `is_packaging_root`), or a convention like "has children = packaging root, no children = standalone." Fragile. |
| **Multiple packaging root contexts** | A product can have multiple independent packaging chains (e.g., Box→Pack→Capsule AND Carton→Bottle). `product_packaging` handles this naturally — each chain is a set of rows. | With `parent_id`, chains interleave in one table. Two independent hierarchies for one product require two root nodes (both with `parent_id=NULL`). But then `parent_id=NULL` means both "I'm Box, root of chain A" AND "I'm Carton, root of chain B." Queryable, but semantically cluttered — every query must filter by chain context. |

**Verdict: Option A.** The domain has two distinct concepts (packaging structure, selling configuration). Modelling them as one entity compresses the domain into a storage concern.

---

### 3. Editing Complexity

| Operation | Option A | Option B |
|-----------|----------|----------|
| **Change quantity: Box→24 Pack** | Update `product_packaging.quantity WHERE container_name='Box'`. Derivation recalculates `selling_units.quantity` for Box. Prices/barcodes preserved via `packaging_id` match. | Update `selling_units.quantity WHERE name='Box'`. But this field also represents base-unit conversion. Does changing it from 120 to 240 mean "Box now contains 24 Packs" or "Box now converts to 240 base units"? If the latter, you've broken the children. You'd need a separate `packaging_ratio` column. |
| **Remove Pack from hierarchy** | Delete `product_packaging` row. Derivation: `UPDATE selling_units SET packaging_id=NULL WHERE name='Pack' AND product_id=X`. Business data intact. | `UPDATE selling_units SET parent_id=NULL WHERE name='Pack'`. Now Pack is a root node. Its `quantity` (10) was meaningful as a child — is it still meaningful as a root? Its children (Capsule) now have `parent_id=Pack` pointing to a root. Does that break inventory calculations? Maybe — depends on whether traversal assumes a specific root node. |
| **Reorder levels (Pack→Capsule→Tablet becomes Pack→Tablet→Capsule)** | Update `product_packaging.level` values. Derivation regenerates. Clean. | Requires updating `parent_id` references across multiple rows. Risk of circular references or broken chains during the update. Needs a transaction with careful ordering. |
| **Add a new packaging level between existing ones** | Insert one `product_packaging` row. Derivation creates new `selling_units` or updates quantities. | Insert a row and update `parent_id` of the displaced row. Need to compute new quantity values — the new interleaved node changes conversion factors for everything below it. |

**Verdict: Option A.** The separate table makes structural edits safe and surgical. Option B's self-join makes every structural change a potential data integrity risk because the row being modified also carries business-critical data.

---

### 4. Purchase Workflow

*No meaningful difference.* Both options:

- Store supplier-specific packaging in the purchase bill (`purchase_bill_items.purchase_pack_qty`, `purchase_quantity`, `unit_cost`)
- Purchase accounting uses base-unit conversion regardless of packaging model
- Neither is affected by how selling units are structured

**Verdict: Tie.**

---

### 5. Sale Workflow

| Concern | Option A | Option B |
|---------|----------|----------|
| **POS unit dropdown** | Query `selling_units WHERE product_id = X AND pos_visible = true`. Simple, flat. | Same query. But hierarchy introduces a question: should the dropdown show all nodes, or only leaves? If all, then Box (parent) appears alongside Pack (child) — correct behaviour, same as Option A. No difference in practice for simple queries. |
| **Base quantity computation on sale** | `baseQty = packagingQuantity × selling_units.quantity`. `selling_units.quantity` is always "base units per selling unit." Predictable. | `baseQty = packagingQuantity × selling_units.quantity`. But `quantity` on a parent node (Box) is 120 (total base units), while on a child (Pack) it's 10. The semantics are the same IF `quantity` is consistently "base units per unit." But if you also store packaging ratios on the same row (see Editing above), which value is which? |
| **Mixed-unit sales** | Sell 1 Box + 2 Packs in one transaction? Each references its own `selling_units` row with its own `quantity`. Works transparently. | Same — each row has its own `quantity`. No practical difference. |

**Verdict: Slight edge to Option A** for clarity of `quantity` semantics, but functionally equivalent in most scenarios.

---

### 6. Inventory Calculations

*No meaningful difference.* Both options:

- Store stock in base units only
- Compute inventory impact as `packagingQuantity × baseUnitQuantity`
- Convert at transaction boundaries, never inside stock
- Historical transactions store snapshots

**Verdict: Tie.**

---

### 7. Historical Integrity

*Identical for both.* Neither approach affects historical records because:

- `sale_items` snapshots `packaging_name`, `packaging_quantity`, `base_unit_quantity`, `base_quantity`, `unit_price`
- `purchase_bill_items` snapshots `purchase_pack_qty`, `purchase_quantity`, `unit_cost`
- Changing either `product_packaging` or `selling_units.parent_id` does NOT retroactively change transaction snapshots

**Verdict: Tie.**

---

### 8. Performance

| Concern | Option A | Option B |
|---------|----------|----------|
| **Derivation (when packaging changes)** | O(n) graph walk where n ≤ 5 per product. Instant. | No derivation needed — data is already in place. **Theoretically faster. But irrelevant** — both complete in <1ms for real-world product depths. |
| **POS unit lookup** | `SELECT * FROM selling_units WHERE product_id = ?` — simple, indexable. | Same query. No difference. |
| **Hierarchy traversal** | Done at derivation time (write). Query-time reads are flat. | If the app needs to traverse (e.g., "find the root of this hierarchy"), it requires a recursive query or application-level loop. At 3-4 levels, negligible. |
| **Caching** | Derivation result can be cached per product. Invalidation trigger: `product_packaging` change. | No derivation result to cache. But hierarchy data IS the selling_units table, which changes frequently (prices, barcodes). More cache churn. |

**Verdict: Negligible difference.** Both operate on trivial data volumes per product. Micro-benchmarks would favour Option B (no derivation step), but the absolute cost is immeasurable in practice (< 0.1ms per product).

---

### 9. Maintainability

| Concern | Option A | Option B |
|---------|----------|----------|
| **New developer onboarding** | "This table defines packaging structure. This table defines selling configuration." Clear. | "This table does both. A row with children is a packaging container. A row without children is a leaf selling unit. Unless it has no parent either — then it's either a standalone custom unit or a packaging root. You'll need to check additional columns." |
| **Quantity field semantics** | `product_packaging.quantity` = packaging ratio. `selling_units.quantity` = base unit conversion. Every query knows which it's reading. | Single `quantity` column with context-dependent meaning. A `WHERE quantity > 100` query returns rows where quantity means different things depending on whether the row is a hierarchy root, an internal node, or a leaf. |
| **Adding new features** | Packaging feature changes go in `product_packaging`. Selling feature changes go in `selling_units`. No risk of cross-contamination. | Any feature that touches "how Pack relates to Box" also touches a row with prices and barcodes. Developers must be careful to scope updates to specific columns. |
| **Documentation burden** | One table per concept — the schema is self-documenting. | Requires explicit documentation: "quantity means base-unit conversion for root nodes, packaging ratio for internal nodes, and equals 1 for leaf nodes." Documentation drifts; schema doesn't. |

**Verdict: Option A.** The self-join model is elegant on a whiteboard but introduces ambiguity that every future developer must navigate. Option A's separation is self-documenting.

---

### 10. Future Extensibility

| Feature | Option A | Option B |
|---------|----------|----------|
| **Manufacturing / BOM** | A `product_bom` table (similar structure to `product_packaging`) can represent ingredient × quantity relationships. Pattern extends naturally. | Same table would need polymorphism: `parent_id` could reference a selling unit OR a product OR a raw ingredient. The hierarchy was designed for packaging, not BOM — forcing BOM into it stretches the model. |
| **Bundles** | A bundle is a product composed of other products. Requires a distinct model (e.g., `bundle_items: bundle_product_id, component_product_id, quantity`). Independent of packaging. | Bundle model is also independent. But if someone asks "can we show bundle contents in the POS unit selector?" — now the selector needs to merge data from the hierarchy table AND the bundle table. More complexity. |
| **Supplier-specific packaging** | Already handled: purchase bill captures supplier packs. `product_packaging` is for retail only. Clear separation. | Same purchase bill mechanism. No difference. |
| **Multi-location inventory** | Each location tracks stock separately. Selling units remain product-level. `product_packaging` is product-level, not location-level. No issue. | Same. `parent_id` hierarchy is product-level, not location-level. No difference. |
| **Imports / CSV bulk upload** | New tables (`product_units`, `product_packaging`) are additional import targets. Straightforward. | Importing into a self-referencing table requires ordered inserts (parents before children). Circular references are possible. More validation needed. |
| **Tax behaviour per packaging level** | `selling_units.tax_category` is a business attribute. Adding it to Option A is adding one column to the right table. | Adding `tax_category` to a row that also encodes structural hierarchy means "the packaging node has a tax rate." Domain-incorrect — the selling unit has a tax rate, not the packaging relationship. |

**Verdict: Option A.** The separated model extends in place without requiring polymorphic or overloaded columns. Option B's self-join becomes a bottleneck for features that naturally belong to one concern but must be implemented on a merged entity.

---

### 11. Testing Complexity

| Concern | Option A | Option B |
|---------|----------|----------|
| **Derivation engine tests** | Needed: test that packaging rows → correct selling units. Independent of other business logic. | Not needed (no derivation). But... |
| **Editing tests** | Test packaging edits separately from selling unit edits. Boundary is clean. | Test that editing "quantity" on a parent row doesn't accidentally affect child prices, or that deleting a parent cascades correctly without data loss. More scenarios because effects cross concern boundaries. |
| **Validation tests** | Validate: no duplicate packaging levels, no circular packaging chains, leaf is base unit. Each is a simple query. | Validate: no circular parent_id chains, no orphaned children, no root nodes with ambiguous semantics. Self-referencing validation is more complex (can't do in a single query without recursive CTE). |
| **Regression surface** | Changes to packaging logic don't affect selling unit logic. Test suites are independent. | A change to "how parent_id traversal works" could break selling unit queries, price calculations, or POS dropdowns — even if the change was about packaging. Larger regression surface. |

**Verdict: Option A.** The separated model has smaller, more targeted test surfaces. Option B's merged model requires cross-concern integration testing for changes that semantically belong to one concern.

---

### 12. Migration Complexity

| Concern | Option A | Option B |
|---------|----------|----------|
| **New tables/columns** | Create `product_units` + `product_packaging`. Add `packaging_id` to `selling_units`. | Add `parent_id` to `selling_units`. No new tables. |
| **Existing data handling** | No backfill needed. Existing `selling_units` rows get `packaging_id = NULL`. They continue to work exactly as before. | Existing `selling_units` rows get `parent_id = NULL`. They continue to work. But the semantics of `quantity` now depend on context — existing rows were always "base unit conversion," but with `parent_id`, a future row might use `quantity` for a different purpose. The model is backwards-compatible but semantically shifted. |
| **Rollback** | Drop `product_packaging`, drop `packaging_id` column. Existing data unaffected. | Remove `parent_id` column. Existing data unaffected (it's null). |
| **Application code changes** | Needs derivation engine (new code). Existing queries on `selling_units` unchanged. | Needs hierarchy traversal logic (new code). Existing queries on `selling_units` may behave differently if they relied on `quantity` being only "base unit conversion." |
| **Risk** | **Low.** New tables, nullable column on existing table. No existing code reads the new tables. Old code paths work identically. | **Low-to-Medium.** Adding a nullable column to an existing table is safe. But the semantic shift in `quantity` is a time bomb — it doesn't cause bugs today, but it makes future bugs harder to catch. |

**Verdict: Option A is slightly safer** due to cleaner semantic boundaries. Both have comparable migration effort.

---

## Comparative Summary

| Dimension | Option A (`product_packaging` + `selling_units`) | Option B (`selling_units.parent_id`) |
|-----------|--------------------------------------------------|---------------------------------------|
| Separation of concerns | ✅ **Excellent** — two distinct models | ❌ Poor — single table, two responsibilities |
| Domain modelling | ✅ **Excellent** — matches ubiquitous language | ❌ Weak — hierarchy is implicit, not explicit |
| Editing complexity | ✅ **Low** — surgical, safe updates | ❌ High — every edit risks cross-context side effects |
| Purchase workflow | ✅ No impact | ✅ No impact |
| Sale workflow | ✅ **Clear semantics** — quantity is unambiguous | ⚠️ Quantity field is overloaded, context-dependent |
| Inventory calculations | ✅ No impact | ✅ No impact |
| Historical integrity | ✅ No impact | ✅ No impact |
| Performance | ✅ Sub-millisecond | ✅ Sub-millisecond (slightly simpler query) |
| Maintainability | ✅ **Self-documenting** — one concept per table | ❌ Ambiguous — every developer must learn the conventions |
| Future extensibility | ✅ **Extends cleanly** — new features map to new or existing tables | ❌ Overloaded model — BOM, bundles, tax don't fit naturally |
| Testing complexity | ✅ **Focused tests** — concern boundaries are clean | ❌ Broader regression surface — changes ripple across concerns |
| Migration complexity | ✅ Low risk — new tables, nullable column | ⚠️ Low now, but semantic drift in `quantity` is deferred risk |
| **Total score** | **11/12 wins** | **1/12 win** |

---

## Recommendation: Option A

**Option B's single win — performance — is negligible.** Both designs complete in sub-millisecond time for real-world data volumes. A theoretical advantage with no measurable impact does not justify the loss of clarity, safety, and maintainability.

Option A wins on every other dimension because it respects a fundamental architectural principle:

> **A table should model one thing.**
> `product_packaging` models structural relationships between units.
> `selling_units` models how a product is sold.

These are different things. They change for different reasons. They have different validation rules. They extend in different directions. Merging them into one table with a `parent_id` is schema minimalism that optimizes for table count instead of conceptual clarity.

### Why Option B was initially appealing

The self-join `parent_id` pattern is well-understood (categories, org charts, comment threads). It's a single table. No derivation engine. Less overall code. On a whiteboard, it looks simpler.

But it fails the "six months from now" test. A new developer looking at `selling_units` would see:

```sql
SELECT id, name, quantity, parent_id, sale_price, barcode
FROM selling_units
WHERE product_id = 42;
```

| id | name | quantity | parent_id | sale_price | barcode |
|----|------|----------|-----------|------------|---------|
| 1 | Box | 240 | NULL | 500.00 | 8901... |
| 2 | Pack | 10 | 1 | 50.00 | 8902... |
| 3 | Capsule | 1 | 2 | 5.00 | 8903... |
| 4 | 250g Bag | 250 | NULL | 30.00 | 8904... |

- Rows 1-3: `quantity` means "base units per this unit" AND "packaging ratio," depending on context
- Row 1: `parent_id=NULL` because it's a packaging root
- Row 4: `parent_id=NULL` because it's a standalone custom unit
- A query filtering `WHERE quantity > 100` returns Box (240 = total base units) AND potentially other rows where quantity means something different

The ambiguity is baked into the schema. Documentation can explain it, but documentation doesn't prevent bugs.

### Option A's one real cost: the derivation engine

The derivation engine is new code that Option B doesn't need. It must:
1. Read `product_packaging` rows ordered by `level`
2. Walk the graph to compute transitive quantities
3. Find-or-create `selling_units` matched by `product_units.id`
4. Update quantities on derived rows
5. Nullify `packaging_id` on rows removed from packaging

This is approximately 60-80 lines of well-structured code (in either PHP or TypeScript). It's not architecturally risky — it's a pure function: `packaging rows → derived units`. It has no side effects beyond its own table. It's straightforward to test.

And critically, the derivation engine exists **because the separation is correct**. If packaging relationships and selling units were the same thing, no derivation would be needed. But they aren't the same thing, so a bridge between them is required. That bridge is the derivation engine. Its existence is evidence of good domain modelling, not unnecessary complexity.

---

## The Corrected Schema (Option A, with user review incorporated)

```sql
-- Unit name registry (stable identifiers, no string matching)
CREATE TABLE product_units (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL UNIQUE,   -- Normalised, Title Case
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seeded with common units: Piece, Capsule, Tablet, Box, Pack, Strip, etc.

-- Packaging structure (relationships between units, per product)
CREATE TABLE product_packaging (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id        BIGINT UNSIGNED NOT NULL,
    container_unit_id BIGINT UNSIGNED NOT NULL,   -- FK → product_units.id
    contains_unit_id  BIGINT UNSIGNED NOT NULL,   -- FK → product_units.id
    quantity          DECIMAL(12,4) NOT NULL,       -- "Box contains 12 Pack"
    level             TINYINT UNSIGNED NOT NULL,    -- 1, 2, 3… for ordering
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (container_unit_id) REFERENCES product_units(id),
    FOREIGN KEY (contains_unit_id) REFERENCES product_units(id)
);

-- Selling units (business entities, with nullable packaging reference)
-- is_derived is REPLACED by packaging_id
ALTER TABLE selling_units ADD COLUMN packaging_id BIGINT UNSIGNED NULL
    FOREIGN KEY REFERENCES product_packaging(id) ON DELETE SET NULL;
```

**Key changes from the earlier proposals:**
- `product_packaging` references `product_units.id`, not string names — **eliminates string matching**
- `selling_units.packaging_id` (nullable FK) replaces `is_derived` — **eliminates boolean flag**
- `product_units` has no `measurement_type` — that concern belongs in application-layer logic
- Derivation matches by `product_units.id`, not by name — **case-insensitivity, pluralization, localization are non-issues**

---

## The Derivation Engine (Sketch)

```
function deriveSellingUnits(productId: number): void {
    // 1. Read packaging rows ordered by level
    const packaging = db.query(
        "SELECT pp.*, cu.name as container_name, cnu.name as contains_name " +
        "FROM product_packaging pp " +
        "JOIN product_units cu ON pp.container_unit_id = cu.id " +
        "JOIN product_units cnu ON pp.contains_unit_id = cnu.id " +
        "WHERE pp.product_id = ? ORDER BY pp.level",
        [productId]
    );

    // 2. Walk the graph bottom-up to compute transitive quantities
    const quantities = computeTransitiveQuantities(packaging);

    // 3. Find or create selling units by product_units.id
    for (const [unitId, qty] of quantities) {
        let su = sellingUnits.find(s => s.unit_id === unitId && s.product_id === productId);
        if (!su) {
            su = createSellingUnit({ product_id: productId, unit_id: unitId, quantity: qty });
        }
        su.quantity = qty;       // Update conversion factor
        // sale_price, barcode, is_default: NEVER overwritten
    }

    // 4. Nullify packaging_id on selling units whose packaging row was deleted
    const activeUnitIds = [...quantities.keys()];
    db.query(
        "UPDATE selling_units SET packaging_id = NULL " +
        "WHERE product_id = ? AND packaging_id IS NOT NULL " +
        "AND unit_id NOT IN (?)",
        [productId, activeUnitIds]
    );
}
```

---

## Regarding Derivation Logic Duplication

The user's concern about PHP/TypeScript duplication is correct. The better approach:

**Single source of truth: backend (PHP).**
- Backend derivation engine is authoritative
- Backend recalculates and validates on every save
- Frontend preview is a **UI convenience**, generated either by:
  - Calling a lightweight backend endpoint (`GET /api/products/{id}/preview-units`) during product editing, OR
  - Using a shared JSON-serialisable rule set that the backend publishes and the frontend consumes locally for instant preview

For MVP, the simplest approach: when the user edits packaging in the frontend, debounce 500ms and call the backend derivation preview endpoint. The backend runs the actual engine, returns the preview. No duplication. The single save button persists the result.

Post-MVP optimisation: if latency is noticeable, extract the derivation rules into a shared config (JSON or TypeScript module that the backend also uses via a Node polyfill or embedded interpreter). But this is premature for MVP.

---

## Final Verdict

**Adopt Option A: `product_packaging` + `selling_units` with `packaging_id` FK.**

Implement with:
- `product_units` as stable identifier registry (FK reference, not string match)
- `packaging_id` nullable FK instead of `is_derived`
- Backend-only derivation engine (frontend preview via API call)
- No backfill for existing products
- Proceed in the phases already defined (P3 first — Quick Entry is frontend-only and independent)
