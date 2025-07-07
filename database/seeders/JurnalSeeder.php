<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\DetailJurnal;
use App\Models\Akuntansi\DaftarAkun;

class JurnalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin user
        $adminUser = \App\Models\User::where('nip', '2023.01.02.03')->first();
        
        // Get akun-akun yang diperlukan
        $kasBank = DaftarAkun::where('kode_akun', '1101')->first(); // Kas
        $piutangPasien = DaftarAkun::where('kode_akun', '1103')->first(); // Piutang Usaha
        $persediaan = DaftarAkun::where('kode_akun', '1104')->first(); // Persediaan Obat
        $utangSupplier = DaftarAkun::where('kode_akun', '2101')->first(); // Utang Usaha
        $pendapatan = DaftarAkun::where('kode_akun', '4101')->first(); // Pendapatan Jasa Medis
        $bebanGaji = DaftarAkun::where('kode_akun', '5101')->first(); // Beban Gaji
        $bebanObat = DaftarAkun::where('kode_akun', '5200')->first(); // HPP Obat

        // Jurnal 1: Pendapatan Jasa Medis - Tunai
        $jurnal1 = Jurnal::create([
            'nomor_jurnal' => 'JE-2025-0001',
            'tanggal_transaksi' => '2025-01-15',
            'keterangan' => 'Pendapatan jasa medis rawat jalan - tunai',
            'total_debit' => 2500000,
            'total_kredit' => 2500000,
            'status' => 'posted',
            'dibuat_oleh' => $adminUser->id,
            'diposting_oleh' => $adminUser->id,
            'tanggal_posting' => now(),
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal1->id,
            'daftar_akun_id' => $kasBank->id,
            'keterangan' => 'Penerimaan tunai dari pasien rawat jalan',
            'jumlah_debit' => 2500000,
            'jumlah_kredit' => 0,
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal1->id,
            'daftar_akun_id' => $pendapatan->id,
            'keterangan' => 'Pendapatan jasa medis rawat jalan',
            'jumlah_debit' => 0,
            'jumlah_kredit' => 2500000,
        ]);

        // Jurnal 2: Pendapatan Jasa Medis - Kredit
        $jurnal2 = Jurnal::create([
            'nomor_jurnal' => 'JE-2025-0002',
            'tanggal_transaksi' => '2025-01-16',
            'keterangan' => 'Pendapatan jasa medis rawat inap - kredit',
            'total_debit' => 15000000,
            'total_kredit' => 15000000,
            'status' => 'posted',
            'dibuat_oleh' => $adminUser->id,
            'diposting_oleh' => $adminUser->id,
            'tanggal_posting' => now(),
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal2->id,
            'daftar_akun_id' => $piutangPasien->id,
            'keterangan' => 'Piutang pasien rawat inap',
            'jumlah_debit' => 15000000,
            'jumlah_kredit' => 0,
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal2->id,
            'daftar_akun_id' => $pendapatan->id,
            'keterangan' => 'Pendapatan jasa medis rawat inap',
            'jumlah_debit' => 0,
            'jumlah_kredit' => 15000000,
        ]);

        // Jurnal 3: Pembayaran Gaji Karyawan
        $jurnal3 = Jurnal::create([
            'nomor_jurnal' => 'JE-2025-0003',
            'tanggal_transaksi' => '2025-01-31',
            'keterangan' => 'Pembayaran gaji karyawan bulan Januari 2025',
            'total_debit' => 45000000,
            'total_kredit' => 45000000,
            'status' => 'posted',
            'dibuat_oleh' => $adminUser->id,
            'diposting_oleh' => $adminUser->id,
            'tanggal_posting' => now(),
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal3->id,
            'daftar_akun_id' => $bebanGaji->id,
            'keterangan' => 'Beban gaji karyawan Januari 2025',
            'jumlah_debit' => 45000000,
            'jumlah_kredit' => 0,
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal3->id,
            'daftar_akun_id' => $kasBank->id,
            'keterangan' => 'Pembayaran gaji via bank',
            'jumlah_debit' => 0,
            'jumlah_kredit' => 45000000,
        ]);

        // Jurnal 4: Pembelian Obat
        $jurnal4 = Jurnal::create([
            'nomor_jurnal' => 'JE-2025-0004',
            'tanggal_transaksi' => '2025-02-01',
            'keterangan' => 'Pembelian obat dari supplier - kredit',
            'total_debit' => 8500000,
            'total_kredit' => 8500000,
            'status' => 'posted',
            'dibuat_oleh' => $adminUser->id,
            'diposting_oleh' => $adminUser->id,
            'tanggal_posting' => now(),
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal4->id,
            'daftar_akun_id' => $persediaan->id,
            'keterangan' => 'Pembelian persediaan obat',
            'jumlah_debit' => 8500000,
            'jumlah_kredit' => 0,
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal4->id,
            'daftar_akun_id' => $utangSupplier->id,
            'keterangan' => 'Utang kepada supplier obat',
            'jumlah_debit' => 0,
            'jumlah_kredit' => 8500000,
        ]);

        // Jurnal 5: Pemakaian Obat (Cost of Goods Sold)
        $jurnal5 = Jurnal::create([
            'nomor_jurnal' => 'JE-2025-0005',
            'tanggal_transaksi' => '2025-02-05',
            'keterangan' => 'Pemakaian obat untuk pasien',
            'total_debit' => 3200000,
            'total_kredit' => 3200000,
            'status' => 'posted',
            'dibuat_oleh' => $adminUser->id,
            'diposting_oleh' => $adminUser->id,
            'tanggal_posting' => now(),
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal5->id,
            'daftar_akun_id' => $bebanObat->id,
            'keterangan' => 'Beban pemakaian obat',
            'jumlah_debit' => 3200000,
            'jumlah_kredit' => 0,
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal5->id,
            'daftar_akun_id' => $persediaan->id,
            'keterangan' => 'Pengurangan persediaan obat',
            'jumlah_debit' => 0,
            'jumlah_kredit' => 3200000,
        ]);

        // Jurnal 6: Draft untuk testing (belum diposting)
        $jurnal6 = Jurnal::create([
            'nomor_jurnal' => 'JE-2025-0006',
            'tanggal_transaksi' => '2025-02-10',
            'keterangan' => 'Penerimaan pembayaran piutang pasien - draft',
            'total_debit' => 5000000,
            'total_kredit' => 5000000,
            'status' => 'draft',
            'dibuat_oleh' => $adminUser->id,
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal6->id,
            'daftar_akun_id' => $kasBank->id,
            'keterangan' => 'Penerimaan pembayaran dari pasien',
            'jumlah_debit' => 5000000,
            'jumlah_kredit' => 0,
        ]);

        DetailJurnal::create([
            'jurnal_id' => $jurnal6->id,
            'daftar_akun_id' => $piutangPasien->id,
            'keterangan' => 'Pengurangan piutang pasien',
            'jumlah_debit' => 0,
            'jumlah_kredit' => 5000000,
        ]);

        echo "Jurnal sample created successfully!\n";
    }
}
