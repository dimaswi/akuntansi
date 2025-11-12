#!/bin/bash
set -e

# Ensure storage and cache directories are writable
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# Start cron service in background (requires root)
service cron start

# Output cron status for debugging
echo "Cron service started"
crontab -l

# Start PHP-FPM in foreground
exec php-fpm
