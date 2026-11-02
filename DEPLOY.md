# Deploy to cPanel

## Prerequisites

- PHP 8.2+
- MySQL 8+ or MariaDB 10+
- Node.js 20+ (only for initial build — not needed on server since assets are committed)
- Composer 2.x
- Git (cPanel Git Version Control or SSH)

## Steps

### 1. Pull on cPanel

```bash
cd ~/public_html
git clone https://github.com/RohanRaj-Singh/invenos-backend.git .
# or via cPanel Git Version Control
```

### 2. Install PHP dependencies

```bash
composer install --no-dev --optimize-autoloader
```

### 3. Configure environment

```bash
cp .env.example .env
nano .env
```

Set your database credentials, app URL, and generate key:

```
APP_URL=https://yourdomain.com
DB_DATABASE=your_database
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

```bash
php artisan key:generate
```

### 4. Database

```bash
php artisan migrate --seed
```

### 5. Storage

```bash
php artisan storage:link
```

### 6. Optimize

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 7. Permissions

```bash
chmod -R 775 storage bootstrap/cache
```

### 8. Directory structure

Ensure the following exist:

```
public/
  .htaccess          ← Laravel's default (included)
  index.php          ← Laravel's front controller (included)
  build/manifest.json ← committed (production assets)
storage/
  app/
    prescriptions/   ← created by storage:link
  logs/
public/
  storage/           ← symlink (created by storage:link)
```

### 9. cPanel-specific notes

- **Root directory**: Point your domain to `public/`
- **PHP version**: Set to 8.2+ in cPanel's "MultiPHP Manager"
- **Cron**: Add `* * * * * cd ~/public_html && php artisan schedule:run >> /dev/null 2>&1` so scheduled backups run. A queue worker is not required for backups; `backup:run` executes directly.
- **Backups**: keep `storage/app/backups` outside the web root and `chmod 770`. The exporter uses `mysqldump` when available and falls back to a chunked PHP exporter when `exec()` is disabled.
- **Failed restore**: a failed restore leaves maintenance mode on deliberately. Run `php artisan backup:recover` (or `php artisan up`) to restore service. Details are appended to `storage/logs/backup.log`.
- **MySQL 8 GTID**: dumps are created with `--set-gtid-purged=OFF`, and older dumps containing `GTID_PURGED` are sanitised during import, so restores are portable between servers.
- **Git**: Use cPanel's "Git Version Control" for auto-deploy, or SSH manually
