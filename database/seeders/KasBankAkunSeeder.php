<?php

namespace Database\Seeders;

use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Database\Seeder;

class KasBankAkunSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $akunKasBank = [
            // Akun Kas dan Bank (sudah ada sebagian di DaftarAkunSeeder)
            [
                'kode_akun' => '1105',
                'nama_akun' => 'Giro yang Belum Jatuh Tempo',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Giro yang diterima namun belum jatuh tempo'
            ],
            [
                'kode_akun' => '1106',
                'nama_akun' => 'Giro yang Sudah Jatuh Tempo',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Giro yang sudah jatuh tempo dan siap dicairkan'
            ],
            [
                'kode_akun' => '1107',
                'nama_akun' => 'Uang Muka Penerimaan',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Uang muka yang diberikan untuk penerimaan'
            ],
            [
                'kode_akun' => '1108',
                'nama_akun' => 'Uang Muka Pengeluaran',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Uang muka yang diberikan untuk pengeluaran'
            ],

            // Bank Accounts Detail
            [
                'kode_akun' => '1102.01',
                'nama_akun' => 'Bank BCA - Operasional',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 4,
                'is_aktif' => true,
                'keterangan' => 'Rekening operasional di Bank BCA'
            ],
            [
                'kode_akun' => '1102.02',
                'nama_akun' => 'Bank Mandiri - Payroll',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 4,
                'is_aktif' => true,
                'keterangan' => 'Rekening untuk payroll di Bank Mandiri'
            ],
            [
                'kode_akun' => '1102.03',
                'nama_akun' => 'Bank BNI - Investasi',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 4,
                'is_aktif' => true,
                'keterangan' => 'Rekening investasi di Bank BNI'
            ],

            // Kewajiban untuk Uang Muka
            [
                'kode_akun' => '2105',
                'nama_akun' => 'Utang Uang Muka Penerimaan',
                'jenis_akun' => 'kewajiban',
                'sub_jenis' => 'kewajiban_lancar',
                'saldo_normal' => 'kredit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Kewajiban atas uang muka yang diterima'
            ],
            [
                'kode_akun' => '2106',
                'nama_akun' => 'Utang Uang Muka Pengeluaran',
                'jenis_akun' => 'kewajiban',
                'sub_jenis' => 'kewajiban_lancar',
                'saldo_normal' => 'kredit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Kewajiban atas uang muka yang dibayarkan'
            ],

            // Beban-beban Bank
            [
                'kode_akun' => '5301',
                'nama_akun' => 'Beban Administrasi Bank',
                'jenis_akun' => 'beban',
                'sub_jenis' => 'beban_usaha',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Biaya administrasi bank'
            ],
            [
                'kode_akun' => '5302',
                'nama_akun' => 'Beban Bunga Bank',
                'jenis_akun' => 'beban',
                'sub_jenis' => 'beban_usaha',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Beban bunga kredit bank'
            ],

            // Pendapatan Bank
            [
                'kode_akun' => '4301',
                'nama_akun' => 'Pendapatan Bunga Bank',
                'jenis_akun' => 'pendapatan',
                'sub_jenis' => 'pendapatan_lainnya',
                'saldo_normal' => 'kredit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Pendapatan bunga tabungan/deposito'
            ],
        ];

        foreach ($akunKasBank as $akun) {
            // Check if account already exists
            $existing = DaftarAkun::where('kode_akun', $akun['kode_akun'])->first();
            if (!$existing) {
                DaftarAkun::create($akun);
            }
        }
    }
}
