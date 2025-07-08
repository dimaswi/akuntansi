<?php

namespace Database\Seeders;

use App\Models\Kas\BankAccount;
use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Database\Seeder;

class BankAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the bank accounts from chart of accounts
        $bankBca = DaftarAkun::where('kode_akun', '1102.01')->first();
        $bankMandiri = DaftarAkun::where('kode_akun', '1102.02')->first();
        $bankBni = DaftarAkun::where('kode_akun', '1102.03')->first();
        $bankGeneral = DaftarAkun::where('kode_akun', '1102')->first();

        $bankAccounts = [
            [
                'kode_rekening' => 'BCA-OP',
                'nama_bank' => 'Bank Central Asia',
                'nama_rekening' => 'RS Sehat Sejahtera - Operasional',
                'nomor_rekening' => '1234567890',
                'cabang' => 'Cabang Jakarta Pusat',
                'saldo_awal' => 50000000,
                'saldo_berjalan' => 50000000,
                'daftar_akun_id' => $bankBca ? $bankBca->id : $bankGeneral->id,
                'jenis_rekening' => 'giro',
                'keterangan' => 'Rekening operasional utama untuk transaksi harian',
                'is_aktif' => true,
            ],
            [
                'kode_rekening' => 'MDR-PR',
                'nama_bank' => 'Bank Mandiri',
                'nama_rekening' => 'RS Sehat Sejahtera - Payroll',
                'nomor_rekening' => '0987654321',
                'cabang' => 'Cabang Jakarta Selatan',
                'saldo_awal' => 25000000,
                'saldo_berjalan' => 25000000,
                'daftar_akun_id' => $bankMandiri ? $bankMandiri->id : $bankGeneral->id,
                'jenis_rekening' => 'giro',
                'keterangan' => 'Rekening khusus untuk payroll karyawan',
                'is_aktif' => true,
            ],
            [
                'kode_rekening' => 'BNI-INV',
                'nama_bank' => 'Bank Negara Indonesia',
                'nama_rekening' => 'RS Sehat Sejahtera - Investasi',
                'nomor_rekening' => '5555666677',
                'cabang' => 'Cabang Jakarta Timur',
                'saldo_awal' => 100000000,
                'saldo_berjalan' => 100000000,
                'daftar_akun_id' => $bankBni ? $bankBni->id : $bankGeneral->id,
                'jenis_rekening' => 'tabungan',
                'keterangan' => 'Rekening tabungan untuk dana investasi dan cadangan',
                'is_aktif' => true,
            ],
            [
                'kode_rekening' => 'BCA-DEP',
                'nama_bank' => 'Bank Central Asia',
                'nama_rekening' => 'RS Sehat Sejahtera - Deposito',
                'nomor_rekening' => '1111222233',
                'cabang' => 'Cabang Jakarta Pusat',
                'saldo_awal' => 200000000,
                'saldo_berjalan' => 200000000,
                'daftar_akun_id' => $bankBca ? $bankBca->id : $bankGeneral->id,
                'jenis_rekening' => 'deposito',
                'keterangan' => 'Deposito berjangka 12 bulan',
                'is_aktif' => true,
            ],
        ];

        foreach ($bankAccounts as $account) {
            // Check if account already exists
            $existing = BankAccount::where('nomor_rekening', $account['nomor_rekening'])->first();
            if (!$existing) {
                BankAccount::create($account);
            }
        }
    }
}
