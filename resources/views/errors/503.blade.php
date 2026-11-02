<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Service unavailable</title>
    <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; background: #f9fafb; color: #111827; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; max-width: 520px; margin: 16px; }
        h1 { font-size: 20px; margin: 0 0 8px; }
        p { color: #4b5563; line-height: 1.6; margin: 0 0 12px; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        .muted { font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Service temporarily unavailable</h1>
        <p>The application is in maintenance mode. This is expected during a backup restore.</p>
        <p>If a restore failed and did not finish, run <code>php artisan backup:recover</code> on the server. It disables maintenance mode and reports the last failure.</p>
        <p class="muted">Details are written to <code>storage/logs/backup.log</code> and <code>storage/logs/laravel.log</code>.</p>
    </div>
</body>
</html>
