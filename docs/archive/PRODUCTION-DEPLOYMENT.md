# InsurePal — Production Deployment Guide

> Last updated: 2026-06-24
> Target stack: Laravel 12 + Inertia v2 + React 19 + MySQL 8 + Redis + Coolify (VPS)

---

## Table of Contents

1. [Pre-Flight Checklist](#1-pre-flight-checklist)
2. [Server Requirements](#2-server-requirements)
3. [Environment Configuration](#3-environment-configuration)
4. [Redis Setup & Migration](#4-redis-setup--migration)
5. [Supervisor Configuration](#5-supervisor-configuration)
6. [Cron / Scheduler](#6-cron--scheduler)
7. [Build & Deploy Commands](#7-build--deploy-commands)
8. [Coolify Deployment Setup](#8-coolify-deployment-setup)
9. [Post-Deployment Checklist](#9-post-deployment-checklist)
10. [Rollback Procedure](#10-rollback-procedure)
11. [Backup Strategy](#11-backup-strategy)
12. [Monitoring & Error Tracking](#12-monitoring--error-tracking)
13. [Security Hardening](#13-security-hardening)
14. [Scaling Considerations](#14-scaling-considerations)

---

## 1. Pre-Flight Checklist

Before any deployment, verify:

- [ ] All API keys/secrets have been **rotated** from their development values
- [ ] `APP_ENV=production` and `APP_DEBUG=false`
- [ ] `LOG_LEVEL=warning` (not `debug`)
- [ ] Redis server is running and reachable
- [ ] MySQL 8+ is running with proper character set (`utf8mb4`)
- [ ] Domain DNS points to the VPS IP
- [ ] SSL certificate is issued (Coolify can auto-provision via Let's Encrypt)
- [ ] `.env` file on server has **all** required variables (use `.env.example` as template)
- [ ] Storage directories exist and are writable
- [ ] Queue worker and Reverb have supervisor configs

---

## 2. Server Requirements

| Component | Requirement | Notes |
|-----------|-------------|-------|
| **PHP** | 8.4+ | Required by Laravel 12 |
| **MySQL** | 8.0+ | InnoDB, `utf8mb4` charset |
| **Redis** | 7.x | Required for cache, sessions, queues |
| **Node.js** | 22.x | Build-time only |
| **Composer** | 2.x | Build-time only |
| **Nginx** | Latest | Reverse proxy (Coolify handles this) |
| **Supervisor** | Latest | Process control for queue/reverb |
| **Extensions** | See below | `ext-bcmath`, `ext-curl`, `ext-dom`, `ext-fileinfo`, `ext-gd`/`ext-imagick`, `ext-json`, `ext-mbstring`, `ext-mysqli`/`ext-pdo_mysql`, `ext-redis`, `ext-xml`, `ext-zip`, `ext-bz2`, `ext-gmp` |

### Install PHP Extensions (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y php8.4-cli php8.4-common php8.4-mysql php8.4-redis \
  php8.4-bcmath php8.4-curl php8.4-dom php8.4-fileinfo php8.4-gd \
  php8.4-mbstring php8.4-xml php8.4-zip php8.4-bz2 php8.4-gmp \
  composer supervisor redis-server

# Verify
php -v
php -m | grep -E "redis|mysqli|bcmath|gd|mbstring|xml|zip|bz2|gmp"
```

---

## 3. Environment Configuration

### 3.1 Copy and customize `.env`

```bash
cp .env.example .env
php artisan key:generate
```

### 3.2 Required `.env` variables

```env
APP_NAME="Insure Pal | Enterprise Insurance Management Software"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://insurepal.app

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=warning
LOG_DEPRECATIONS_CHANNEL=null

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=insurepal
DB_USERNAME=insurepal
DB_PASSWORD=<random-strong-password>

SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_SECURE_COOKIE=true

CACHE_STORE=redis

QUEUE_CONNECTION=redis

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=<generate>
REVERB_APP_KEY=<generate>
REVERB_APP_SECRET=<generate>
REVERB_HOST=insurepal.app
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8080

# Reverb rate limiting (production)
REVERB_APP_RATE_LIMITING_ENABLED=true
REVERB_APP_RATE_LIMIT_MAX_ATTEMPTS=60
REVERB_APP_RATE_LIMIT_DECAY_SECONDS=60
REVERB_APP_ALLOWED_ORIGINS=https://insurepal.app

MAIL_MAILER=smtp
MAIL_HOST=<smtp-host>
MAIL_PORT=587
MAIL_USERNAME=<smtp-user>
MAIL_PASSWORD=<smtp-password>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@insurepal.app"
MAIL_FROM_NAME="${APP_NAME}"

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=<s3-key>
AWS_SECRET_ACCESS_KEY=<s3-secret>
AWS_DEFAULT_REGION=eu-west-2
AWS_BUCKET=insurepal-prod
AWS_URL=https://insurepal-prod.s3.eu-west-2.amazonaws.com

PAYSTACK_SECRET_KEY=<live-secret-key>
PAYSTACK_PUBLIC_KEY=<live-public-key>

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=${APP_URL}/auth/google/callback

MICROSOFT_CLIENT_ID=<microsoft-client-id>
MICROSOFT_CLIENT_SECRET=<microsoft-client-secret>
MICROSOFT_REDIRECT_URI=${APP_URL}/auth/microsoft/callback

# SMS (Termii — Nigeria)
SMS_PROVIDER=termii
TERMII_API_KEY=<termii-api-key>
TERMII_SENDER_ID=InsurePal

RECYCLE_BIN_RETENTION_DAYS=30
```

### 3.3 Caching for Production

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## 4. Redis Setup & Migration

### 4.1 Install & Configure Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server

# Basic hardening
sudo sed -i 's/# requirepass foobared/requirepass <strong-redis-password>/' /etc/redis/redis.conf
sudo sed -i 's/bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf
sudo systemctl restart redis-server
```

### 4.2 Verify Redis

```bash
redis-cli -a '<password>' ping
# Should return: PONG
```

### 4.3 Why Redis (not database)

| Component | Before | After (Redis) | Benefit |
|-----------|--------|---------------|---------|
| **Cache** | `database` (MySQL) | `redis` | 10-100x faster reads, no DB load |
| **Session** | `database` (MySQL) | `redis` | Sub-millisecond reads, auto-expiry |
| **Queue** | `database` (MySQL) | `redis` | Non-blocking, Horizon compatible |

---

## 5. Supervisor Configuration

Create `/etc/supervisor/conf.d/insurepal.conf`:

```ini
[program:insurepal-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /home/forge/insurepal.app/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600 --queue=default,notifications,reports
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=2
user=forge
redirect_stderr=true
stdout_logfile=/home/forge/insurepal.app/storage/logs/worker.log
stopwaitsecs=3600

[program:insurepal-reverb]
command=php /home/forge/insurepal.app/artisan reverb:start
autostart=true
autorestart=true
user=forge
redirect_stderr=true
stdout_logfile=/home/forge/insurepal.app/storage/logs/reverb.log
stopwaitsecs=30
```

### Load & Restart

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
sudo supervisorctl status
```

---

## 6. Cron / Scheduler

Add to crontab (`crontab -e`):

```cron
* * * * * cd /home/forge/insurepal.app && php artisan schedule:run >> /dev/null 2>&1
```

### Scheduled Tasks (defined in `routes/console.php`)

| Command | Schedule | Description |
|---------|----------|-------------|
| `policies:process-expirations` | Daily 08:00 | Process policy expiry |
| `reports:process-scheduled` | Daily 02:00 | Generate scheduled NAICOM reports |
| `notifications:payment-due-reminders` | Daily 08:00 | Send payment reminders |
| `policies:send-expiry-notifications` | Daily 08:00 | Send policy expiry alerts |
| `recycle-bin:prune` | Daily 02:00 | Clean soft-deleted records |

---

## 7. Build & Deploy Commands

### 7.1 Full Deployment Script

```bash
#!/bin/bash
set -e

echo "🚀 Deploying InsurePal..."

cd /home/forge/insurepal.app

# Maintenance mode
php artisan down --retry=60

# Pull latest code (Coolify handles git pull)
# git pull origin main

# Install PHP deps (production only)
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Install JS deps & build
npm ci --no-audit --no-fund
npm run build

# Run migrations
php artisan migrate --force

# Cache everything
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Storage link
php artisan storage:link

# Bring app back
php artisan up

# Restart queue workers (graceful)
php artisan queue:restart

# Supervisor restart (optional — only if config changed)
# sudo supervisorctl restart insurepal-queue:*
# sudo supervisorctl restart insurepal-reverb

# Health check
sleep 3
curl -sf https://insurepal.app/up > /dev/null && echo "✅ Health check passed" || echo "⚠️  Health check failed"

echo "✅ Deployment complete"
```

### 7.2 Build Step (Isolated for CI/CD)

```bash
# PHP
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Node
npm ci --no-audit --no-fund --ignore-scripts
npm run build

# Optional: SSR build
# npm run build:ssr
```

### 7.3 Deploy Step (Isolated)

```bash
php artisan down --retry=60
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan storage:link
php artisan up
php artisan queue:restart
```

---

## 8. Coolify Deployment Setup

### 8.1 Create New Resource

1. In Coolify dashboard → **Services** → **New** → **Web Application**
2. Select your GitHub repository
3. Set the following:

| Setting | Value |
|---------|-------|
| **Build Pack** | `Laravel` |
| **Port** | `9000` (or let Coolify detect) |
| **Start Command** | (leave default — Laravel pack auto-detects) |
| **Install Command** | `composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev` |
| **Build Command** | `npm ci --no-audit --no-fund && npm run build` |
| **Deploy Command** | `php artisan migrate --force` |
| **Health Check** | `https://insurepal.app/up` |
| **Base Directory** | `/` |

### 8.2 Environment Variables

Add **all** variables from Section 3.2 in the Coolify dashboard's **Environment** tab. Do **not** commit `.env` to git.

### 8.3 Coolify Post-Deployment Scripts

In Coolify's **Deploy** tab, add post-deployment commands:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan storage:link
php artisan queue:restart
```

### 8.4 Coolify Scheduler

Coolify has a built-in cron feature. Add:

```cron
* * * * * php artisan schedule:run
```

### 8.5 Coolify Service Integrations

Add these as Coolify **Services** (Docker images):

| Service | Coolify Template | Purpose |
|---------|-----------------|---------|
| **MySQL 8** | `mysql:8.0` | Primary database |
| **Redis 7** | `redis:7-alpine` | Cache, sessions, queues |
| **Nginx** | (built-in proxy) | TLS termination, reverse proxy |

---

## 9. Post-Deployment Checklist

- [ ] Visit `https://insurepal.app/up` — should return `{"status":"ok"}` (or 200)
- [ ] Log in as super admin — verify dashboard loads
- [ ] Verify Inertia SSR (if enabled) — `View page source` should show server-rendered HTML
- [ ] Test WebSocket connection — open browser console, verify Reverb connects
- [ ] Test queue — trigger a notification, check `php artisan queue:monitor`
- [ ] Verify mail — trigger password reset, confirm email arrives
- [ ] Test file upload — upload a document, verify storage disk works
- [ ] Check log files — `storage/logs/laravel.log` for any errors
- [ ] Verify supervisors — `sudo supervisorctl status` shows both processes running
- [ ] Check cron — `grep CRON /var/log/syslog` to confirm scheduler runs

---

## 10. Rollback Procedure

### 10.1 Coolify Quick Rollback

Coolify stores previous deployments. Use the UI to **Rollback** to a prior version. Then:

```bash
php artisan down --retry=60
php artisan migrate:rollback --step=1   # If migration was the issue
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

### 10.2 Manual Git Rollback

```bash
git revert HEAD
git push origin main
# Coolify will auto-deploy the revert
```

### 10.3 Database Rollback

```bash
# Rollback last migration
php artisan migrate:rollback --step=1 --force

# Or rollback all and re-migrate
php artisan migrate:refresh --force   # ⚠️ Destroys data — only if seed needed
```

---

## 11. Backup Strategy

### 11.1 Database Backups

Daily automated backup script (`/etc/cron.d/insurepal-backup`):

```cron
0 3 * * * forge /home/forge/insurepal.app/deploy/backup.sh
```

Backup script (`deploy/backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/home/forge/backups"
DB_NAME="insurepal"
DB_USER="insurepal"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p "$BACKUP_DIR"

# Dump DB
mysqldump --user="$DB_USER" --password="$DB_PASSWORD" --single-transaction \
  "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Keep last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz" "s3://insurepal-backups/db/"
```

### 11.2 File Backups

```bash
# Backup uploaded files
tar -czf "/home/forge/backups/storage_${TIMESTAMP}.tar.gz" \
  /home/forge/insurepal.app/storage/app/

# Upload to S3
aws s3 cp "/home/forge/backups/storage_${TIMESTAMP}.tar.gz" \
  "s3://insurepal-backups/storage/"
```

### 11.3 S3 Storage Offload

For production, switch `FILESYSTEM_DISK=s3` and configure an S3-compatible bucket (AWS S3, DigitalOcean Spaces, MinIO, etc.). This ensures:

- Uploads survive server termination
- Multiple app servers share the same files
- CDN can serve public assets

---

## 12. Monitoring & Error Tracking

### 12.1 Error Tracking (Sentry)

```bash
composer require sentry/sentry-laravel
php artisan vendor:publish --provider="Sentry\Laravel\ServiceProvider"
```

Configure in `.env`:

```env
SENTRY_LARAVEL_DSN=<your-dsn>
SENTRY_TRACES_SAMPLE_RATE=0.25
```

### 12.2 Log Monitoring

Laravel logs rotate automatically with `daily` channel. Set:

```env
LOG_CHANNEL=daily
LOG_DAILY_DAYS=30
```

### 12.3 Queue Monitoring

```bash
# Check queue size
php artisan queue:monitor

# Horizon (if using Redis queues)
composer require laravel/horizon
php artisan horizon:install
php artisan horizon
```

### 12.4 Server Monitoring

Install in Coolify or manually:

```bash
# Node Exporter (Prometheus)
# Netdata
# Uptime Kuma (Coolify built-in)
```

### 12.5 Application Health Checks

The `/up` route returns a simple health check. Extend it in `bootstrap/app.php` or create a dedicated health controller that checks:

- Database connection
- Redis connection
- Queue worker status
- Disk space
- Scheduler last run time

---

## 13. Security Hardening

### 13.1 HTTP Headers

Add to `.htaccess` or Nginx config:

```nginx
# Force HTTPS
if ($scheme != "https") {
    return 301 https://$host$request_uri;
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
```

### 13.2 Rate Limiting

Add to `bootstrap/app.php`:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('api', fn (Request $request) => 
    Limit::perMinute(60)->by($request->user()?->id ?: $request->ip())
);

RateLimiter::for('auth', fn (Request $request) => 
    Limit::perMinute(5)->by($request->ip())
);
```

### 13.3 CORS

Verify `config/cors.php` restricts to production domain:

```php
'allowed_origins' => [env('APP_URL')],
```

### 13.4 Reverb Allowed Origins

In `.env`:

```env
REVERB_APP_ALLOWED_ORIGINS=https://insurepal.app
```

### 13.5 Session Cookie

```env
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_HTTP_ONLY=true
```

### 13.6 File Permissions

```bash
# After every deploy
sudo chown -R forge:forge storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## 14. Scaling Considerations

### 14.1 Multi-Server Architecture

When scaling beyond a single VPS:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Load        │────▶│  App Server  │────▶│  MySQL 8     │
│  Balancer    │     │  1..N        │     │  (RDS/DO)    │
│  (Nginx/HA)  │     │              │     └──────────────┘
└──────────────┘     │  + Redis     │     ┌──────────────┐
                     │  + Reverb    │────▶│  S3/MinIO    │
                     └──────────────┘     │  (Shared FS)  │
                                          └──────────────┘
```

### 14.2 What to Scale First

| Symptom | Solution |
|---------|----------|
| High CPU on DB | Upgrade MySQL, add indexes, enable query cache |
| Slow page loads | Enable Inertia SSR, use deferred props |
| Queue backlog | Increase `numprocs` in supervisor |
| WebSocket latency | Dedicated Reverb server with Redis scaling |
| File upload slowness | Move to S3/CDN immediately |

### 14.3 Performance Optimization

```bash
# OPcache (PHP 8.4)
# Already enabled — verify in php.ini:
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0   # Production only

# Nginx gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_min_length 256;
```

### 14.4 CDN

Serve `public/build/assets/*` via CDN:

```env
# In .env
ASSET_URL=https://cdn.insurepal.app
```

Then in `config/filesystems.php` or `vite.config.ts`, set the CDN URL for asset paths.

---

## Appendix A: Production Environment Checklist

```
□  PHP 8.4+ with required extensions
□  MySQL 8+ with utf8mb4
□  Redis 7+ with password
□  Supervisor running queue + reverb
□  Cron running scheduler
□  SSL certificate issued
□  S3 bucket configured (for uploads)
□  Sentry/error tracking configured
□  Daily backups configured
□  Monitoring alerts configured
□  Rate limiting enabled
□  CORS restricted to production domain
□  Reverb allowed origins restricted
□  Session secure cookie enabled
□  APP_DEBUG=false
□  APP_ENV=production
□  LOG_LEVEL=warning
□  OPcache enabled with validate_timestamps=0
□  All dev dependencies removed from composer.lock
□  Storage directories writable
```

## Appendix B: Common Commands

```bash
# Tail logs
tail -f storage/logs/laravel.log

# Check queue
php artisan queue:monitor

# Check supervisor
sudo supervisorctl status

# Clear all caches (troubleshooting)
php artisan optimize:clear

# Rebuild all caches
php artisan optimize

# Test queue worker
php artisan queue:work redis --once

# Test mail
php artisan tinker
> Mail::raw('Test', fn($m) => $m->to('admin@insurepal.app')->subject('Test'));

# List routes
php artisan route:list
```

## Appendix C: Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 500 error after deploy | Cached config mismatch | `php artisan optimize:clear` then `php artisan optimize` |
| Queue jobs not processing | Supervisor not running | `sudo supervisorctl restart insurepal-queue:*` |
| WebSocket not connecting | Reverb not running | `sudo supervisorctl restart insurepal-reverb` |
| CSS/JS 404 | Vite manifest not found | Run `npm run build` |
| "No application encryption key" | APP_KEY not set | `php artisan key:generate` |
| Slow page loads | Session/cache on DB | Switch to Redis |
| Email not sending | SMTP misconfigured | Check MAIL_* vars, test with `php artisan tinker` |
| Paystack webhook failing | URL not whitelisted | Add webhook URL in Paystack dashboard |
