# This is a GitHub and Server Commands

## Local development

git add .
git commit -m "Added broker workflow"
git push origin main

## Server deployment

ssh root@184.94.215.54

cd /var/www/insurepal

git pull origin main

composer install --no-dev --prefer-dist --optimize-autoloader

npm ci

NODE_OPTIONS="--max-old-space-size=2048" npm run build

php artisan optimize:clear
php artisan optimize

php artisan queue:restart

## Run migrations only when you've added new migration files:

php artisan migrate --force

## Delete Files from github
git rm .github/workflows/deploy.yml

git commit -m "Remove GitHub Actions deployment"

git push origin main

# My daily debugging workflow for InsurePal

<!-- If I were maintaining your server, I'd usually have three terminals -->

# Terminal 1 – Laravel

tail -f /var/www/insurepal/storage/logs/laravel.log

# Terminal 2 – Nginx

tail -f /var/log/nginx/error.log

# Terminal 3 – PHP-FPM

journalctl -u php8.4-fpm -f