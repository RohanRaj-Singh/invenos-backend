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
- **Cron**: No queue workers needed for current features
- **Git**: Use cPanel's "Git Version Control" for auto-deploy, or SSH manually
