# 19 — User Acceptance & Operational Testing

Each scenario states steps, expected results and measurable pass/fail criteria. All scenarios
assume the app is running against a disposable test database. None have been executed; this is
the acceptance plan.

---

## Scenario A — Simple product regression

**Purpose:** prove composition work does not change ordinary products.

**Steps**
1. Create a product with name, cost, selling price, unit `piece`, starting stock `0`.
2. Purchase 100 units at Rs. 10 each from a supplier.
3. Sell 10 units at Rs. 20 to a walk-in customer.
4. Return 2 units, resellable.
5. Open Inventory, the product detail, Stock Movements, Sales list, Sales report and P&L.

**Expected**
- Product create saves with no errors and no ledger rows besides the opening adjustment if stock
  was entered.
- Purchase increases stock by 100 and sets `average_cost = 10`.
- Sale decreases stock by 10 and snapshots `cost_price = 10`.
- Return increases stock by 2 and reduces revenue/party balance.
- Stock Movements shows `purchase`, `sale`, `sale-return`.
- Report totals match the document totals.

**Pass/fail**
- PASS: final stock = 92; ledger sum = 92; sale COGS = 100; return reflected in net sales.
- FAIL: any stock mismatch, missing movement, or report total differing from the documents.

---

## Scenario B — Formula product definition (no stock effect)

**Purpose:** define a reusable formula without deducting inventory.

**Steps**
1. Create components: Bun, Patty, Cheese, Sauce (each with a base unit and opening stock).
2. Open the Bun product detail → Formula tab (or the agreed builder entry point).
3. Set kind = `assembly`, output quantity = 1.
4. Add Bun ×1, Patty ×1, Cheese ×1, Sauce ×20 ml.
5. Save. Return to Inventory and open Stock Movements for every component.
6. Edit the formula to Sauce ×25 ml and save again.

**Expected**
- The formula saves and reloads.
- No `inventory_transactions` row is created for any component.
- `products.stock_quantity` is unchanged for all components.
- The edit is versioned or replaces the active template according to the chosen policy; past
  versions/runs (none yet) are unaffected.

**Pass/fail**
- PASS: 0 new movements, 0 stock change, formula persists and validates.
- FAIL: any stock movement, any change to `stock_quantity`, or a formula that cannot be reloaded.

---

## Scenario C — Consumption-based service at POS

**Purpose:** sell a service that consumes a template and allows a per-sale override.

**Precondition:** components stocked; service product exists with a `consumption` template:
Cleanser 5 ml, Serum 2 ml, Mask 1 unit, Gloves 1 pair.

**Steps**
1. Add the service to the cart at Rs. 1,500.
2. Open the Consumption editor; verify defaults are 5/2/1/1 × quantity 1.
3. Change Serum to 3 ml.
4. Complete the sale, cash, full payment.
5. Inspect Stock Movements for each component, the sale detail, COGS/profit and the receipt.

**Expected**
- Exactly one `sale_items` row (the service).
- Component movements: Cleanser −5, Serum −3, Mask −1, Gloves −1, typed `consumption`.
- The saved template still says Serum 2 ml.
- Revenue = 1,500; COGS = rolled component cost; no component revenue.
- Receipt optionally shows "materials used", separate from sold items.

**Pass/fail**
- PASS: one sale line, four consumption movements, template unchanged, COGS = rolled cost.
- FAIL: component sale lines, wrong quantities, template mutation, or COGS = 0.

---

## Scenario D — Multiple quantities, fractional units, unit conversion

**Purpose:** prove scaling and unit conversion.

**Steps**
1. Sell 5 units of the Scenario C service with defaults.
2. Sell 0.5 of a service whose template uses 2 ml.
3. Define a component in grams while its base unit is kilograms; enter 250 g.
4. Verify the ledger quantities.

**Expected**
- Defaults scale linearly: 5 → Cleanser 25 ml, Serum 10 ml, etc.
- Fractional quantity: 0.5 → 1 ml.
- 250 g is stored as 0.25 kg (base unit), not 250.
- Unit compatibility is enforced; a count unit cannot be converted to ml.

**Pass/fail**
- PASS: all scaled quantities exact within the documented rounding; incompatible units rejected.
- FAIL: any linear-scaling error, base-unit error, or silent unit mismatch.

---

## Scenario E — Insufficient component inventory

**Purpose:** prove all-or-nothing.

**Steps**
1. Set Serum stock to 4 ml.
2. Attempt to sell a service requiring 2 ml of Serum and 5 ml of Cleanser three times (total
   Serum 6 ml).
3. Observe the error.
4. Inspect sales, sale items, ledger and stock for all components.

**Expected**
- The sale is rejected before any movement.
- No sale row, no sale items, no consumption rows.
- Cleanser stock is unchanged (no partial deduction).
- The error names the shortage (need/available).

**Pass/fail**
- PASS: 0 new documents, 0 new movements, stock unchanged.
- FAIL: a sale exists, any component deducted, or a generic/unreadable error.

---

## Scenario F — Returns and refunds

**Purpose:** prove consumed materials are not silently restored.

**Steps**
1. Complete Scenario C.
2. Return the service in full with a cash refund.
3. Return an assembled composite sale with `restock=true`.
4. Reverse a production run (if implemented).

**Expected**
- Service refund: cash out, party balance adjusted, revenue reduced, **component stock unchanged**.
- Assembled composite return: finished good restocked if `restock=true`; components unchanged.
- Run reversal: components restored, finished stock removed, run marked reversed, audit written.
- No double restoration and no negative guard bypass beyond documented reversal.

**Pass/fail**
- PASS: service components unchanged; finished good correct; reversal compensated and auditable.
- FAIL: ingredients restored automatically, double restock, or ledger drift.

---

## Scenario G — Company / tenant isolation

**Purpose:** record the current reality and define the future test.

**Current branch (single tenant):**
1. Search the schema and code for `company_id`/`organization_id`.
2. Attempt to access a formula by product id from another "company" — not possible.

**Expected:** no company concept exists; all data is global. This is **N/A** on this branch.

**Fashion branch (future port):**
1. Create a formula in company A using a component available only to A.
2. Log in as company B.
3. Attempt to view/execute the formula and reference the component.

**Expected:** B cannot see or execute A's formula; B cannot consume A's component stock;
availability uses `company_product_stock`, not the global scalar.

**Pass/fail**
- PASS (clinic): documented as N/A, no false isolation claim.
- PASS (fashion): 403/404 and no cross-company stock movement.
- FAIL: any cross-company read or execution.

---

## Scenario H — Historical integrity

**Purpose:** changing a formula must not rewrite history.

**Steps**
1. Sell a service with the Scenario C template.
2. Record the run's `template_snapshot`, component quantities and cost.
3. Edit the template (change Serum to 10 ml, change component prices via a new purchase).
4. Re-open the original sale and run history.
5. Run COGS/profit reports for the original period.

**Expected**
- The original run still shows Serum 2 ml (or the overridden 3 ml).
- The original cost snapshot is unchanged.
- New sales use the new template.
- Historical reports do not change because of the template/cost edit.

**Pass/fail**
- PASS: run snapshot and sale COGS identical before/after the edit.
- FAIL: history mutated, COGS recalculated, or old run shows new quantities.

---

## Scenario I — Negative-stock policy

**Purpose:** prove the policy is explicit and consistent.

**Steps**
1. For a component, test `allow_negative_stock = null`, `true`, `false`.
2. Test `track_inventory = false`.
3. Attempt a sale that exceeds stock with and without `bypass_stock_check`.
4. Test a `REV-` reversal movement.

**Expected**
- `false` blocks the sale.
- `true`/`null` follows the global setting and the model default (currently `true`).
- `track_inventory = false` does not block.
- `bypass_stock_check` allows the sale and records the negative movement.
- Reversals are allowed and documented.

**Pass/fail**
- PASS: behavior matches the documented matrix; the formula path uses the same policy.
- FAIL: the formula path silently allows negatives regardless of policy.

---

## Scenario J — Authorization

**Purpose:** prove composition actions are protected server-side.

**Steps**
1. Log in as `salesman`.
2. Attempt to create/edit a formula via the UI and via a direct request.
3. Attempt to override consumption.
4. Attempt to reverse a run.
5. Attempt to view another role's cost data.

**Expected**
- Create/edit formula: 403 unless permitted.
- Override consumption: allowed only with `sales.consume.override`.
- Reverse run: 403 unless manager/admin.
- Cost/availability payloads are filtered by permission.

**Pass/fail**
- PASS: every forbidden action returns 403 at the server, not just hidden in React.
- FAIL: any action succeeds despite the role.

---

## Scenario K — Backup / restore with composition

**Steps**
1. Create formulas, runs and a service sale.
2. Create a backup.
3. Restore it into a clean database.
4. Reopen product detail, run history, sale detail and reports.

**Expected**
- All composition tables, runs and items restore.
- FKs resolve; counts verify.
- Reports match the pre-backup state.
- Restoring a pre-composition backup succeeds and leaves empty composition tables.

**Pass/fail**
- PASS: exact counts and relationships after restore.
- FAIL: missing runs/items, broken FKs, or reports differing after restore.

---

## UAT sign-off checklist

| # | Scenario | Owner | Result | Evidence |
|---|---|---|---|---|
| A | Simple product regression | | | |
| B | Formula definition | | | |
| C | Consumption sale | | | |
| D | Scaling/units | | | |
| E | Insufficient inventory | | | |
| F | Returns/refunds | | | |
| G | Tenant isolation | | | |
| H | Historical integrity | | | |
| I | Negative stock | | | |
| J | Authorization | | | |
| K | Backup/restore | | | |
