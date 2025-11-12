# Laravel Scheduler dengan Docker

## Setup Cron untuk Laravel Scheduler di Docker

### File-file yang dibuat:

1. **docker/cron/laravel-scheduler** - Cron job configuration
2. **docker/entrypoint.sh** - Entry point script untuk menjalankan cron dan PHP-FPM
3. **Dockerfile** - Updated dengan instalasi cron

### Cara Kerja:

1. Dockerfile menginstall `cron` package
2. Copy file `laravel-scheduler` ke `/etc/cron.d/`
3. Set permission dan apply crontab
4. Entrypoint script menjalankan cron service di background
5. PHP-FPM tetap berjalan di foreground

### Deploy ke Production:

#### 1. Build ulang Docker image:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Verifikasi cron berjalan:
```bash
# Masuk ke container
docker exec -it akuntansi bash

# Cek apakah cron service berjalan
ps aux | grep cron

# Cek crontab
crontab -l

# Monitor log scheduler (optional)
tail -f storage/logs/laravel.log
```

#### 3. Test manual scheduler:
```bash
docker exec -it akuntansi php artisan schedule:run
```

### Scheduled Tasks yang Akan Berjalan:

Berdasarkan `routes/console.php`:

1. **Stock Opname Reminders** - Setiap hari jam 08:00 WIB
   - Command: `opname:send-reminders`
   - Mengirim notifikasi ke departemen yang belum melakukan opname

2. **Low Stock Alerts** - Setiap hari jam 08:00 WIB
   - Command: `inventory:check-low-stock`
   - Mengirim notifikasi untuk item dengan stok rendah

### Monitoring di Production:

#### Cara 1: Log Laravel
```bash
docker exec -it akuntansi tail -f storage/logs/laravel.log
```

#### Cara 2: Cron Log
```bash
docker exec -it akuntansi tail -f /var/log/cron.log
```

#### Cara 3: Database Notifications
Cek table `notifications` untuk melihat notifikasi yang dikirim

### Troubleshooting:

#### Cron tidak jalan?
```bash
# Restart container
docker-compose restart akuntansi

# Atau restart cron service
docker exec -it akuntansi service cron restart
```

#### Permission error?
```bash
docker exec -it akuntansi chmod -R 775 storage
docker exec -it akuntansi chown -R www-data:www-data storage
```

#### Timezone tidak sesuai?
Edit `.env`:
```
APP_TIMEZONE=Asia/Jakarta
```

Lalu restart container:
```bash
docker-compose restart akuntansi
```

### Alternative: Separate Scheduler Container (Optional)

Jika ingin scheduler berjalan di container terpisah:

**docker-compose.yml:**
```yaml
  scheduler:
    container_name: akuntansi_scheduler
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ./:/var/www/html
    working_dir: /var/www/html
    command: sh -c "while true; do php artisan schedule:run; sleep 60; done"
    networks:
      - akuntansi
    depends_on:
      - akuntansi_db
```

Keuntungan: Lebih mudah monitoring dan restart tanpa mempengaruhi PHP-FPM
Kerugian: Menggunakan resource lebih banyak (1 container tambahan)

### Best Practice Production:

1. ✅ Gunakan `.env` production yang berbeda
2. ✅ Set `APP_DEBUG=false`
3. ✅ Set `APP_ENV=production`
4. ✅ Pastikan `LOG_CHANNEL=daily` untuk rotation
5. ✅ Monitor disk space untuk logs
6. ✅ Setup external monitoring (Sentry, NewRelic, dll)

### Checklist Deployment:

- [ ] Build image dengan `--no-cache`
- [ ] Verifikasi cron service berjalan
- [ ] Test manual `schedule:run`
- [ ] Tunggu sampai jam 08:00 untuk auto-run pertama
- [ ] Monitor logs untuk memastikan tidak ada error
- [ ] Cek notifications table
- [ ] Verifikasi user menerima notifikasi

---

**Catatan:** 
- Cron akan berjalan otomatis setiap restart container
- Tidak perlu setup crontab manual di server host
- Semua sudah terintegrasi dalam Docker container
