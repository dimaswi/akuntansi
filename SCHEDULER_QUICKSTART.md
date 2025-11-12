# Quick Start - Laravel Scheduler di Docker

## 🚀 Deploy ke Production

### 1. Build dan Jalankan
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 2. Verifikasi Cron Berjalan
```bash
# Cek cron service
docker exec -it akuntansi service cron status

# Cek crontab
docker exec -it akuntansi crontab -l

# Output:
# * * * * * root cd /var/www/html && php artisan schedule:run >> /var/log/cron.log 2>&1
```

### 3. Test Manual
```bash
docker exec -it akuntansi php artisan schedule:run
```

### 4. Monitor Log
```bash
# Cron log
docker exec -it akuntansi tail -f /var/log/cron.log

# Laravel log
docker exec -it akuntansi tail -f storage/logs/laravel.log
```

## 📋 Scheduled Tasks

| Command | Schedule | Deskripsi |
|---------|----------|-----------|
| `opname:send-reminders` | Daily 08:00 WIB | Kirim reminder opname ke dept terlambat |
| `inventory:check-low-stock` | Daily 08:00 WIB | Alert stok rendah |

## 🔧 Troubleshooting

### Cron tidak jalan?
```bash
docker-compose restart akuntansi
```

### Permission error?
```bash
docker exec -it akuntansi chmod -R 775 storage bootstrap/cache
```

### Lihat error detail?
```bash
docker exec -it akuntansi cat /var/log/cron.log
```

## ✅ Checklist

- [ ] Build image tanpa cache
- [ ] Cron service running
- [ ] Test manual schedule:run
- [ ] Monitor log jam 08:00
- [ ] Cek notifications table
- [ ] Verifikasi user dapat notifikasi

## 📁 Files Modified

- `Dockerfile` - Install cron
- `docker/cron/laravel-scheduler` - Cron config
- `docker/entrypoint.sh` - Start cron + PHP-FPM
- `routes/console.php` - Schedule definition
