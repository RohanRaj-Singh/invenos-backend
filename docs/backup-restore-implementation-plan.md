# Invenos — Backup & Restore Implementation Plan

**Status: Phases 1–3 implemented. 35 backup tests passing.**

### Duplicate prevention and diagnostics

- `BackupService::create` reuses a verified backup created within `BACKUP_DUPLICATE_WINDOW` seconds (default 30) for manual/scheduled runs, so double-clicks and overlapping calls do not create a second file.
- `backup:run` without `--scheduled` refuses to create another backup when one completed within `BACKUP_CLI_DUPLICATE_WINDOW` minutes (default 5) unless `--force` is passed.
- `php artisan backup:status` prints counts by kind/status, the recent history, suspected duplicates (same kind within 2 minutes), queued jobs, work-directory leftovers and the retention settings.
- Stale work directories/files older than 24 hours are cleaned automatically.

### Restore incident fixes (GTID 3546)

- Dumps now use `--set-gtid-purged=OFF` on MySQL (omitted on MariaDB).
- Imports run through `SqlSanitizer`, which strips `GTID_PURGED`, `SQL_LOG_BIN` and `GTID_NEXT` statements, so artifacts created before the fix restore correctly.
- A failed restore now re-checks the live table counts: if the import failed before any data was dropped (the GTID case), maintenance mode is disabled automatically instead of leaving a 503.
- `php artisan backup:recover` clears maintenance mode, closes interrupted runs, and prints the last failure and safety backup.
- Restore requests call `set_time_limit(0)` and `ignore_user_abort(true)`; progress is written to `storage/logs/backup.log`.
- A custom `errors/503.blade.php` explains recovery.

## Implementation status

| Area | Files |
|---|---|
| Schema | `database/migrations/2026_11_01_000010_create_backups_table.php`, `…_000011_create_restore_runs_table.php` |
| Models | `app/Models/Backup.php`, `app/Models/RestoreRun.php` |
| Artifact | `app/Domains/Backup/Support/{BackupCipher,BackupManifest,SqlSplitter,SqlSanitizer}.php` |
| Services | `app/Domains/Backup/Services/{DatabaseExporter,FileCollector,BackupService,BackupVerifier,RestoreService,RetentionService}.php` |
| HTTP | `app/Http/Controllers/BackupController.php`, `routes/web.php:197-204` |
| Automation | `app/Console/Commands/{BackupRunCommand,BackupRecoverCommand}.php`, `routes/console.php` |
| Settings | `app/Domains/Settings/Services/SettingService.php`, `app/Http/Requests/Settings/UpdateSettingsRequest.php` |
| UI | `resources/js/Pages/settings/BackupRestore.tsx` |
| Config | `config/backup.php`, `config/filesystems.php` (`backups` disk) |
| Docs | `DEPLOY.md` (cron + storage notes) |
| Tests | `tests/Unit/Backup/{BackupCipherTest,SqlSplitterTest,SqlSanitizerTest}.php`, `tests/Feature/Backup/{BackupServiceTest,BackupHttpTest,RestoreTest,RetentionTest,BackupScheduleTest,BackupRecoverTest}.php` |

Verified locally: a real 0.63 MB backup of `invenos_snapshot` (31 tables, 8,385 rows, 4 files) was created, verified, and downloaded; runtime tables were absent; the encrypted variant rejected a wrong password.

**Source:** `~/.commandcode/plans/backup-restore-foundation-audit.md`
**Scope:** local-only backup and restore. **Google Drive is explicitly out of scope until Phases 1–3 pass.**
**Runtime verified:** `master` @ `7ad87e9`; PHP 8.4.16; `zip` and `openssl` available, `sodium` unavailable; `mysqldump`/`mysql` present locally. Production extension availability must be re-checked at deploy time.

---

## Phase 1 — Secure local backup foundation

### Deliverables

1. `backups` table + `Backup` model with explicit statuses: `pending`, `running`, `completed`, `verified`, `failed`, `expired`.
2. `BackupService` replaces the monolithic controller (`app/Domains/Backup/`).
3. `DatabaseExporter`:
   - `mysqldump --single-transaction --quick --skip-lock-tables --routines --no-tablespaces --default-character-set=utf8mb4`.
   - Password passed via `MYSQL_PWD` environment, never `argv`.
   - Chunked PHP exporter fallback (no `exec` required), streaming to disk.
   - Runtime tables excluded: `cache`, `cache_locks`, `sessions`, `jobs`, `job_batches`, `failed_jobs`, `backups`, `restore_runs`.
4. `FileCollector` includes `storage/app/prescriptions` and `storage/app/public/logos`.
5. Artifact `.invbak`:
   - ZIP (`manifest.json`, `database.sql`, `files/…`).
   - Optional password encryption: AES-256-GCM via OpenSSL (XChaCha20-Poly1305 automatically when `sodium` exists), PBKDF2-SHA256/Argon2id, random salt + nonce, chunked AEAD.
   - SHA-256 of the whole artifact stored in the DB.
6. `BackupVerifier`: size + checksum always; manifest/file hashes when the passphrase is available.
7. Secure download route, admin-only, status-gated.
8. History with metadata and deletion safeguards (never delete newest verified, running, or safety backup).
9. Pending-queue awareness: `jobs` count recorded in the manifest and surfaced as a warning; excluded from the dump.

### Acceptance criteria

- [ ] A manual backup produces a `backups` row in `verified` state and a readable artifact.
- [ ] The artifact contains a valid manifest, `database.sql`, and prescription/logo files.
- [ ] Runtime tables are absent from `database.sql`.
- [ ] With a password, the artifact is unreadable without it; wrong password and one-byte tampering both fail.
- [ ] Download is 403 for non-admins and 404 for anything not `completed`/`verified`.
- [ ] Deleting the newest verified backup is refused without an explicit force flag.
- [ ] The PHP exporter works when `mysqldump` is unavailable.
- [ ] Pending job count is visible before backup and in the manifest.
- [ ] Tests cover creation, scope, encryption, download permissions, verification, deletion safeguards.

---

## Phase 2 — Safe restoration

### Deliverables

1. `restore_runs` table + `RestoreRun` model (`validating`, `ready`, `running`, `verifying`, `completed`, `failed`).
2. Restore sources: uploaded `.invbak`, existing local backup.
3. `RestoreService`:
   - Validate magic/format/version, decrypt, verify manifest and hashes, check compatibility.
   - Preview (app/format/schema version, counts, encryption, warnings) — **no writes**.
   - Typed confirmation.
   - Maintenance mode + `Cache::lock`.
   - Automatic safety backup before importing.
   - Import via `mysql` CLI when available, otherwise a quote/comment-aware SQL splitter.
   - Restore files, verify row counts, run pending migrations, clear caches, invalidate sessions.
   - Refuse restore while `jobs` has pending work unless explicitly forced; report the count.
4. Routes and UI wizard reusing `SettingsLayout`/`SettingsCard`.

### Acceptance criteria

- [ ] `inspect` never touches business data.
- [ ] Restore without the exact confirmation phrase is rejected.
- [ ] A safety backup exists before the first destructive statement.
- [ ] A missing/corrupt/tampered artifact is rejected before maintenance mode.
- [ ] Successful restore recreates a deleted row and restores uploaded files.
- [ ] Failed import leaves maintenance mode on, records the failing step, and points to the safety backup.
- [ ] Sessions are invalidated after restore.
- [ ] Pending jobs block restore unless `force` is supplied.

---

## Phase 3 — Automation

### Deliverables

1. `backup:run {--scheduled} {--password=} {--no-uploads}` command.
2. `Schedule::command('backup:run --scheduled')->everyMinute()->withoutOverlapping(180)`; the command decides whether it is due.
3. Business timezone (`settings.business.timezone`, default `Asia/Karachi`) for daily/weekly/monthly due checks.
4. Retention: 7 daily, 4 weekly, 12 monthly, 3 safety — destination-aware and never deleting protected rows.
5. Settings group `backup` (enabled, frequency, time, timezone, retention).
6. cPanel cron documentation.
7. Failure reporting in the `backups` row + audit log.

### Acceptance criteria

- [ ] Scheduled run executes once per due period in the business timezone.
- [ ] Overlap protection prevents concurrent runs.
- [ ] Retention removes only expired rows and never the newest verified/running/safety backup.
- [ ] Failure leaves a `failed` row with a reason and a non-zero exit code.
- [ ] Disabling automatic backups stops new runs.
- [ ] Tests cover due-gate, overlap, retention protections, and failure recording.

---

## Out of scope

- Google Drive/OAuth.
- S3 provider.
- Point-in-time recovery/binlogs.
- Backup of application code or `.env` in plaintext.

---

## Operational notes

- `DEPLOY.md` must add: `* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1`.
- If `exec`/`mysqldump` is disabled, the PHP exporter is used automatically; no configuration change is required.
- Backups are stored on the private `backups` disk (`storage/app/backups`), never under `public/`.
- Restore is not transactionally atomic in MySQL (DDL implicit commits); the safety backup is the recovery path.
