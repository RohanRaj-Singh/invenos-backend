# 14 — Backup, Restore, Import & Export

## 1. Backup architecture

**VERIFIED.**

`app/Domains/Backup/Services/BackupService` creates an encrypted/zip archive containing:

- `manifest.json` (`BackupManifest`);
- `database.sql` (`DatabaseExporter`);
- selected file sources (`FileCollector`);
- optional encryption (`BackupCipher`).

`BackupService::create` uses a cache lock, a duplicate window, and records metadata in
`backups`. `BackupRunCommand`/`schedule` drive scheduled backups; `BackupRecoverCommand` restores
service after a failed restore.

### Database export

`DatabaseExporter::dump()`:

1. requires MySQL;
2. reads `config('backup.exclude_tables')`;
3. counts rows per table;
4. tries `mysqldump` (with `--single-transaction`, `--set-gtid-purged=OFF` unless MariaDB,
   `--ignore-table` for each excluded table);
5. falls back to a chunked PHP exporter using `SHOW CREATE TABLE` + batched inserts.

It dumps **every base table that is not excluded**, discovered dynamically:

```php
SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'
```

### Excluded tables

```
cache, cache_locks, sessions, jobs, job_batches, failed_jobs, backups, restore_runs
```

### File sources

```
prescriptions → storage/app/prescriptions
logos         → storage/app/public/logos
```

## 2. Composition tables in backups

**VERIFIED:** because the exporter discovers tables dynamically, any new composition tables
(`product_compositions`, `product_composition_items`, `composition_runs`,
`composition_run_items`) are included automatically. No backup configuration change is needed.

The manifest records per-table row counts (`table_counts`) and `excluded_tables`. A backup taken
after composition will therefore advertise those tables and their counts.

## 3. Restore architecture

`RestoreService`:

1. inspects an uploaded/local artifact (decrypts if needed, reads manifest);
2. rejects a backup whose `schema_version` is greater than the current migration count;
3. creates a **safety backup** before touching data;
4. enables maintenance mode (`artisan down`);
5. sanitizes GTID/session lines (`SqlSanitizer`);
6. imports the SQL with FK/unique checks disabled, via `mysql` CLI or PHP `SqlSplitter`;
7. restores files;
8. verifies every table count is **>=** the manifest count;
9. runs `php artisan migrate --force` (so older backups gain new tables);
10. clears caches, invalidates sessions, exits maintenance mode.

`databaseLooksIntact()` can re-enable service if the import failed before dropping rows.

## 4. Effect on composition data

| Scenario | Result |
|---|---|
| New backup, same/newer app | All composition tables restored; FKs disabled during import so order is not a problem |
| Old backup (pre-composition) restored into new app | Import succeeds; `migrate` creates empty composition tables; no formulas exist |
| New backup restored into older app | Rejected because `schema_version` > current |
| Restore fails mid-import | Safety backup exists; maintenance may stay on by design until `backup:recover`/`artisan up` |
| Foreign keys | Dumps include `DROP TABLE`/`CREATE TABLE`; restore disables FK checks; counts verified afterward |

**RISK:** the verifier checks `actual >= expected`, not equality. Extra rows are tolerated. This
is acceptable for restore but means a formula table could contain more rows than the manifest
without failing verification.

## 5. Ordering and dependencies

- The dump is ordered by table discovery, not by a dependency graph. FK checks are off during
  import, so formula tables can be created in any order.
- `composition_run_items.inventory_transaction_id` must reference a ledger row. Both tables are
  in the same dump; with FK checks off, the insert order does not matter.
- On a fresh restore, `migrate` runs after import. Migrations must be idempotent enough not to
  fail if the tables already exist (they won't, because the import recreated them from the
  dump; `migrate` sees the migration row and skips).

## 6. Product import / export

**VERIFIED ABSENT.**

There is no product import, product export, inventory import, CSV product upload or company
migration. The only exports are report CSV/XLSX/PDF via `ExportService`.

Therefore:

- there is no product export format that must learn about composition;
- there is no import path that could create a composite without its components;
- a full database backup is the only way to move formulas between installations.

**PROPOSED:** if a product export is added later, define a versioned schema with nested
composition items, and import in two passes (products, then composition) with a dry-run.

## 7. Data portability concerns

| Concern | Detail |
|---|---|
| Component identity | A formula references component `products.id`. Exporting to another install requires remapping ids. |
| Units | `base_unit_id` is a string, so it is portable; `product_unit_id` is an id and needs remapping. |
| Run history | `composition_runs`/`composition_run_items` are historical; importing them into a new install is optional and should preserve `template_snapshot`. |
| Costs | Historical costs are snapshots; do not recompute on import. |
| Schema version | The backup manifest's migration count is the compatibility gate. |

## 8. Required changes

| Change | Phase | Notes |
|---|---|---|
| None for backup inclusion | – | Dynamic discovery already handles new tables |
| Add composition tables to test fixtures | P1 | Backup/restore tests should include them |
| Verify restore with runs/items | P7 | Add to the backup test suite |
| Product export (if added) | later | Versioned nested format |
| Do not exclude composition tables | – | Keep them in the dump |

## 9. Findings summary

1. **VERIFIED:** backups discover tables dynamically; new tables are included automatically.
2. **VERIFIED:** restore disables FK checks, verifies counts, then migrates.
3. **VERIFIED:** newer-schema backups are rejected on older apps.
4. **VERIFIED:** no product import/export exists.
5. **PROPOSED:** only add restore tests for runs; no backup code change is required.
