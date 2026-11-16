# Invenos — Product Composition Audit

**Status:** Read-only audit. No application code, schema, data, or branch was modified.
**Date:** 2026-11-15

## 1. Scope

This audit covers every subsystem that can be affected by introducing Formula / Composite
Products into Invenos:

- product identity, units, packaging, pricing and lifecycle;
- inventory ledger and stock writers;
- POS and sales;
- purchasing and procurement;
- returns, refunds and reversals;
- costing and profitability;
- reports, dashboards and exports;
- serialization, JSON endpoints and integrations;
- authorization and tenant isolation;
- backup/restore and data transfer;
- events, jobs, audit and automation;
- frontend product management, POS and shared UI;
- tests, regression coverage and implementation sequencing.

It covers three intended behaviors:

1. **Simple products** — unchanged.
2. **Composite / formula products** — a sellable product assembled from component products.
3. **Consumption-based products** — a service/sale whose template consumes components, with
   per-transaction overrides that never mutate the saved template.

## 2. Branch / worktree audited

| Item | Value |
|---|---|
| Repository root | `C:\Users\Rohan Raj Singh\Projects\invenos-product-composition` |
| Current branch | `feature/product-composition` @ `50be1bd` |
| Base branch | `master` @ `50be1bd` (the clinic baseline) |
| Fashion branch | `variation/clothing-erp` @ `d0ff43e`, in the separate `invenos-clothing-erp` / `invenos-backend` worktrees |
| Branch named `clinic` | **None.** The clinic line is `master`; `feature/product-composition` descends from it |
| Branch named `fashion` | **None.** Fashion is `variation/clothing-erp` |
| Uncommitted work in this worktree | `docs/architecture/product-composition-plan.md` (untracked, pre-existing; left untouched) |
| Fashion worktree | Not entered, not read beyond git metadata, not modified |

**Safety posture:** no branch switch, merge, rebase, reset, stash, checkout or commit was
performed. No fashion file was touched. No migration was executed. This directory is the only
write.

## 3. Method

1. Read git state (`branch -a -vv`, `worktree list`, `status`, `log`).
2. Mapped every PHP and TS/TSX file under `app/` and `resources/js/`.
3. Read all product, inventory, sales, purchase, return, report, backup, lifecycle and settings
   services and their controllers/requests.
4. Read every relevant migration to reconstruct the actual schema.
5. Searched the whole repository for product-type assumptions, stock writers, authorization and
   absent subsystems (`company_id`, `warehouse`, `production`, `formula`, `composite`).
6. Compared findings against the pre-existing (untracked) plan and the prior formula audit in
   `docs/`, and re-verified their claims against current code.
7. Wrote the audit as separate documents, then reconciled them into the cross-system matrix
   (`20-cross-system-impact-matrix.md`).

### Evidence legend

| Marker | Meaning |
|---|---|
| **VERIFIED** | Read directly in code, migration, route or test |
| **RISK** | Verified defect or architectural limitation that the feature would amplify |
| **PROPOSED** | Recommended design; not implemented |
| **ABSENT** | Searched for and not found |
| **UNKNOWN** | Requires a business/product decision |

File references use `path` plus class/method/table names. Exact line numbers are cited only
where they were captured directly during the audit; method names are used otherwise so the
reference does not rot.

## 4. Document index

| # | Document | Contents |
|---|---|---|
| 00 | [00-executive-summary.md](./00-executive-summary.md) | Overall findings, risk, sequence, decisions |
| 01 | [01-product-architecture.md](./01-product-architecture.md) | Product model, schema, units, packaging, lifecycle |
| 02 | [02-database-impact.md](./02-database-impact.md) | Every relevant table and relationship, schema proposal |
| 03 | [03-backend-product-domain.md](./03-backend-product-domain.md) | Services, DTOs, requests, controllers, dead code |
| 04 | [04-inventory-stock-impact.md](./04-inventory-stock-impact.md) | Ledger, stock writers, guards, transaction boundaries |
| 05 | [05-sales-pos-impact.md](./05-sales-pos-impact.md) | Sale lifecycle, server trust, formula expansion |
| 06 | [06-purchase-procurement-impact.md](./06-purchase-procurement-impact.md) | Purchasing, costing, component procurement |
| 07 | [07-frontend-product-management.md](./07-frontend-product-management.md) | Product list/form/detail, formula builder fit |
| 08 | [08-frontend-pos-impact.md](./08-frontend-pos-impact.md) | POS cart, editor, stock checks, receipts |
| 09 | [09-reports-analytics-impact.md](./09-reports-analytics-impact.md) | Every report and its formula |
| 10 | [10-returns-reversals-impact.md](./10-returns-reversals-impact.md) | Returns, refunds, reversal behavior |
| 11 | [11-costing-profitability-impact.md](./11-costing-profitability-impact.md) | Cost sources, roll-up, snapshots, margins |
| 12 | [12-api-integrations-impact.md](./12-api-integrations-impact.md) | Inertia, JSON endpoints, import/export, barcode |
| 13 | [13-security-permissions-impact.md](./13-security-permissions-impact.md) | Auth, roles, permissions, isolation |
| 14 | [14-backup-restore-data-transfer-impact.md](./14-backup-restore-data-transfer-impact.md) | Backup, restore, portability |
| 15 | [15-events-jobs-automation-impact.md](./15-events-jobs-automation-impact.md) | Events, jobs, audit, scheduling |
| 16 | [16-frontend-shared-components-impact.md](./16-frontend-shared-components-impact.md) | Reusable UI and accessibility |
| 17 | [17-testing-regression-impact.md](./17-testing-regression-impact.md) | Existing tests, gaps, regression matrix |
| 18 | [18-implementation-roadmap.md](./18-implementation-roadmap.md) | Phased plan, acceptance, rollback |
| 19 | [19-user-acceptance-testing.md](./19-user-acceptance-testing.md) | Business scenarios and pass/fail |
| 20 | [20-cross-system-impact-matrix.md](./20-cross-system-impact-matrix.md) | Mandatory cross-system matrix |
| P0.1 | [P0.1-FINALIZATION.md](./P0.1-FINALIZATION.md) | P0 test-baseline finalization and gate |
| P1 | [P1-SCHEMA-DOMAIN.md](./P1-SCHEMA-DOMAIN.md) | Composition schema and domain foundation |
| P1.1 | [P1.1-VERIFICATION.md](./P1.1-VERIFICATION.md) | Independent P1 verification and corrections |
| P2 | [P2-MANAGEMENT.md](./P2-MANAGEMENT.md) | Composition management API and formula builder |

## 5. Important findings (short form)

1. **The composition domain is greenfield.** No formula, BOM, recipe, component, production or
   run table exists. `products.product_type` is a dead enum: it is fillable, but no request,
   DTO, service or UI writes or reads it; the live form hard-codes `'simple'`.
2. **The ledger already has a `consumption` movement type** and a single signed
   `inventory_transactions` table. There is no `production`, `transfer` or reserved-stock
   concept.
3. **Inventory is written from several places, not one.** `InventoryService` is the intended
   gateway, but product create writes an opening ledger row directly, product edit writes
   `stock_quantity` with no ledger at all, and two legacy return services write rows and
   increment/decrement directly.
4. **`InventoryService::applyMovement()` is private, yet `TransactionEngine` calls it.** The
   engine is registered but unreachable from any live route; if revived it fatals.
5. **All sale and purchase stock movements are atomic only because their services open
   `DB::transaction`.** The inventory method itself opens no transaction.
6. **No multi-company, warehouse, transfer, brand, variant, product-import, product-export,
   webhook or API-versioning layer exists on this branch.** Those parts of the brief are
   **ABSENT**, not merely incomplete.
7. **Authorization is mostly absent.** Only lifecycle delete/archive/restore are gated (and
   those gates are all `isAdmin`). Product/sale/purchase/return create and update run for any
   authenticated user; every relevant FormRequest returns `authorize(): true`.
8. **Costing has four valuation variants and three COGS variants.** Formula consumption must
   write cost explicitly or reports will disagree with each other.
9. **Reports treat one sale line = one stock movement = one revenue line.** A composite product
   breaks that assumption unless component consumption is recorded separately from sale lines.

## 6. Completeness checklist

| Area | Searched | Result |
|---|---|---|
| Product model/schema | `app/Models`, `database/migrations` | Complete |
| Product backend flow | controllers, requests, DTOs, services | Complete |
| Units/packaging | `ProductUnitService`, `PackagingDerivationEngine`, `app/Domains/Products` | Complete |
| Inventory | `InventoryService`, ledger, reconcile command | Complete |
| Sales/POS | `SaleService`, `SaleController`, `SaleBill.tsx` | Complete |
| Purchases | `PurchaseService`, `PurchaseController`, purchase migrations | Complete |
| Returns | canonical `ReturnService` + legacy return services | Complete |
| Reports | all `app/Domains/Reports/Services` + routes | Complete |
| Costing | `CostResolver`, purchase averaging, sale snapshot | Complete |
| Serialization/API | controllers, Inertia props, JSON endpoints | Complete (API thin) |
| Authorization | gates, policies, requests, controller `authorize` | Complete |
| Backup/restore | exporter, restorer, manifest, config | Complete |
| Events/jobs | observers, listeners, queue, schedule | Complete (none) |
| Frontend | `resources/js` pages, features, components, lib | Complete |
| Tests | `tests/Unit`, `tests/Feature` | Complete (catalogued) |
| Companies/warehouses/transfers | repository-wide search | **ABSENT** |
| Product import/export | repository-wide search | **ABSENT** |
| Brands/variants | repository-wide search | **ABSENT** |
| Manufacturing/production | repository-wide search | **ABSENT** |

## 7. Known limitations

- The full test suite was **not executed** during this audit. Test behavior is documented from
  the test source. The pre-existing plan records two failures on this baseline; they were not
  re-run here.
- Fashion was deliberately not audited beyond git metadata. Any statement about fashion comes
  from the pre-existing plan and is marked as such.
- Business decisions (yield, wastage, overhead, substitution, negative stock policy) cannot be
  resolved from code.
- No production database was inspected. All schema statements come from migrations and models.

## 8. Outstanding questions

See §7 of `00-executive-summary.md`. The blocking decisions are: composite vs consumption
semantics, whether consumption happens at sale or production, output yield, wastage, cost
snapshot policy, negative-stock policy for components, permission model, and whether
`product_type` should ever become meaningful.

## 9. Explicit non-goals

This audit does not implement formula functionality, does not create migrations, does not
modify models, forms, POS, inventory, reports, tests or configuration, and does not merge the
fashion branch.
