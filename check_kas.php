<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Akuntansi\DaftarAkun;

echo "Checking kas accounts...\n";

$kasAkun = DaftarAkun::where('nama_akun', 'like', '%kas%')->first();
echo "Kas Akun exists: " . ($kasAkun ? 'YES - ' . $kasAkun->nama_akun : 'NO') . "\n";

if (!$kasAkun) {
    echo "Creating kas account...\n";
    $kasAkun = new DaftarAkun([
        'kode_akun' => '1.1.1.001',
        'nama_akun' => 'Kas',
        'jenis_akun' => 'aset',
        'saldo_normal' => 'debit',
        'is_active' => true
    ]);
    $kasAkun->save();
    echo "Created kas account with ID: " . $kasAkun->id . "\n";
}
