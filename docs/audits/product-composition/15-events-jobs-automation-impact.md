# 15 — Events, Jobs, Notifications & Automation

## 1. Current state

**VERIFIED.**

- **No model observers.**
- **No application events or listeners** (only Laravel's built-in auth notification).
- **No domain jobs**; `QUEUE_CONNECTION=database` and the `jobs` tables exist but nothing
  dispatches to them.
- **No notifications** beyond email verification.
- **No background synchronization.**
- **Audit:** `App\Services\Lifecycle\AuditService` writes `audit_logs`, but only for archive /
  delete / restore / permanent delete.
- **Scheduling:** `routes/console.php` schedules `backup:run --scheduled` **every minute** with
  `withoutOverlapping(180)`.

## 2. Why this matters for composition

Composition execution has real side effects (stock, cost, history). The absence of an event
system is **not a blocker**; in fact it makes correctness easier:

- all effects can be applied synchronously inside the existing `DB::transaction`;
- there is no queue retry that could consume twice;
- there is no asynchronous listener ordering to reason about.

**Recommendation:** keep execution synchronous and transactional. Do not introduce a job for
consumption in v1.

## 3. Duplicate-execution risk

**VERIFIED:** there is no idempotency mechanism for sales or purchases. A double submit creates
two documents and two stock movements. Composition adds a second expensive side effect
(component consumption), so the risk is higher.

**PROPOSED safeguards:**

1. Add an idempotency key to sale creation (client-generated UUID, unique per tenant) and to
   composition execution.
2. Add a unique constraint on `composition_runs (source_type, source_id, composition_id)` so a
   retry cannot create a second run for the same sale.
3. Check `effects_applied_at` before applying (same pattern as `ReturnService`).
4. Wrap execution in `DB::transaction` and lock the run row.

## 4. Audit records

**PROPOSED events to write into `audit_logs`:**

| Event | When | Reason field |
|---|---|---|
| `ProductComposition.created` | template saved | – |
| `ProductComposition.updated` | template edited | – |
| `ProductComposition.deactivated` | template disabled | reason |
| `CompositionRun.completed` | consumption applied | source document |
| `CompositionRun.reversed` | run reversed | reason |
| `CompositionRun.failed` | validation/transaction failure (optional) | error summary |

`audit_logs` stores `auditable_type`/`auditable_id`; the run/template is a valid morph target.
Do not log component costs in the description if cost visibility is restricted.

## 5. Notifications

**ABSENT.** If the business wants low-component alerts or failed-run alerts, they must be added
explicitly. Do not add notifications in v1 unless requested; they add delivery and retry
semantics that the current app does not have.

## 6. Scheduled tasks

Only the backup schedule exists. If composition needs a scheduled reconciliation (e.g. rebuild
run totals), add a command and schedule it explicitly. There is no queue worker requirement for
backups (`backup:run` executes directly), and the same should hold for any composition command.

## 7. Side effects and ordering

A single composition execution must, in order:

1. lock the template/run (if re-executing);
2. lock component product rows in a deterministic order;
3. validate availability and units;
4. write `composition_runs` (pending);
5. apply component movements;
6. write `composition_run_items` with the movement ids;
7. write the finished/sale cost;
8. mark the run completed;
9. write the audit record.

All inside one transaction. If an event system is added later, it must fire **after commit**
(`DB::afterCommit`) to avoid acting on rolled-back data.

## 8. Existing automation that composition must not disturb

| Automation | Behavior | Risk |
|---|---|---|
| Backup every minute | duplicate window prevents spam | none |
| `stock:reconcile` | reports drift, does not fix | will report formula drift if the ledger is bypassed |
| `backup:run` schedule | direct execution | none |
| Cash/party ledger rebuild commands | not read in detail; do not touch | none |

## 9. Findings summary

1. **VERIFIED:** no events, jobs, observers or notifications.
2. **VERIFIED:** audit logging exists only for lifecycle.
3. **VERIFIED:** no idempotency for transactions.
4. **PROPOSED:** synchronous transactional execution; audit events; unique run per source.
