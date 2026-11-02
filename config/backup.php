<?php

return [

    'disk' => env('BACKUP_DISK', 'backups'),

    'format_version' => 1,

    'dump_binary' => env('BACKUP_DUMP_BINARY', 'mysqldump'),

    'mysql_binary' => env('BACKUP_MYSQL_BINARY', 'mysql'),

    'work_dir' => storage_path('app/tmp/backups'),

    // Reuse a backup created moments ago instead of writing a duplicate
    // (double-click on "Create backup", overlapping cron calls).
    'duplicate_window_seconds' => (int) env('BACKUP_DUPLICATE_WINDOW', 30),

    // Refuse a non-scheduled `backup:run` when one already completed recently.
    'cli_duplicate_window_minutes' => (int) env('BACKUP_CLI_DUPLICATE_WINDOW', 5),

    'max_restore_bytes' => (int) env('BACKUP_MAX_RESTORE_BYTES', 1024 * 1024 * 1024),

    'exclude_tables' => [
        'cache',
        'cache_locks',
        'sessions',
        'jobs',
        'job_batches',
        'failed_jobs',
        'backups',
        'restore_runs',
    ],

    'file_sources' => [
        'prescriptions' => storage_path('app/prescriptions'),
        'logos' => storage_path('app/public/logos'),
    ],

    'crypto' => [
        'chunk_bytes' => (int) env('BACKUP_CHUNK_BYTES', 4 * 1024 * 1024),
        'pbkdf2_iterations' => (int) env('BACKUP_PBKDF2_ITERATIONS', 310000),
        'argon_mem' => (int) env('BACKUP_ARGON_MEM', 67108864),
        'argon_ops' => (int) env('BACKUP_ARGON_OPS', 4),
    ],

    'retention' => [
        'daily' => (int) env('BACKUP_RETAIN_DAILY', 7),
        'weekly' => (int) env('BACKUP_RETAIN_WEEKLY', 4),
        'monthly' => (int) env('BACKUP_RETAIN_MONTHLY', 12),
        'safety' => (int) env('BACKUP_RETAIN_SAFETY', 3),
    ],

];
