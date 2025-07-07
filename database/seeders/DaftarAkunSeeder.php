<?php

namespace Database\Seeders;

use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Database\Seeder;

class DaftarAkunSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $akun = [
            // ASET
            [
                'kode_akun' => '1000',
                'nama_akun' => 'ASET',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 1,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Aset'
            ],
            [
                'kode_akun' => '1100',
                'nama_akun' => 'ASET LANCAR',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Aset Lancar'
            ],
            [
                'kode_akun' => '1101',
                'nama_akun' => 'Kas',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Kas di tangan'
            ],
            [
                'kode_akun' => '1102',
                'nama_akun' => 'Bank',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Rekening bank'
            ],
            [
                'kode_akun' => '1103',
                'nama_akun' => 'Piutang Usaha',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Piutang dari pasien/pelanggan'
            ],
            [
                'kode_akun' => '1104',
                'nama_akun' => 'Persediaan Obat',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Persediaan obat-obatan'
            ],
            [
                'kode_akun' => '1105',
                'nama_akun' => 'Persediaan Alat Medis',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_lancar',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Persediaan alat medis'
            ],
            [
                'kode_akun' => '1200',
                'nama_akun' => 'ASET TETAP',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_tetap',
                'saldo_normal' => 'debit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Aset Tetap'
            ],
            [
                'kode_akun' => '1201',
                'nama_akun' => 'Peralatan Medis',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_tetap',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Peralatan medis'
            ],
            [
                'kode_akun' => '1202',
                'nama_akun' => 'Gedung',
                'jenis_akun' => 'aset',
                'sub_jenis' => 'aset_tetap',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Gedung rumah sakit'
            ],

            // KEWAJIBAN
            [
                'kode_akun' => '2000',
                'nama_akun' => 'KEWAJIBAN',
                'jenis_akun' => 'kewajiban',
                'sub_jenis' => 'kewajiban_lancar',
                'saldo_normal' => 'kredit',
                'level' => 1,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Kewajiban'
            ],
            [
                'kode_akun' => '2100',
                'nama_akun' => 'KEWAJIBAN LANCAR',
                'jenis_akun' => 'kewajiban',
                'sub_jenis' => 'kewajiban_lancar',
                'saldo_normal' => 'kredit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Kewajiban Lancar'
            ],
            [
                'kode_akun' => '2101',
                'nama_akun' => 'Hutang Usaha',
                'jenis_akun' => 'kewajiban',
                'sub_jenis' => 'kewajiban_lancar',
                'saldo_normal' => 'kredit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Hutang kepada supplier'
            ],
            [
                'kode_akun' => '2102',
                'nama_akun' => 'Hutang Gaji',
                'jenis_akun' => 'kewajiban',
                'sub_jenis' => 'kewajiban_lancar',
                'saldo_normal' => 'kredit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Hutang gaji karyawan'
            ],

            // MODAL
            [
                'kode_akun' => '3000',
                'nama_akun' => 'MODAL',
                'jenis_akun' => 'modal',
                'sub_jenis' => 'modal_saham',
                'saldo_normal' => 'kredit',
                'level' => 1,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Modal'
            ],
            [
                'kode_akun' => '3100',
                'nama_akun' => 'Modal Pemilik',
                'jenis_akun' => 'modal',
                'sub_jenis' => 'modal_saham',
                'saldo_normal' => 'kredit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Modal pemilik rumah sakit'
            ],
            [
                'kode_akun' => '3200',
                'nama_akun' => 'Laba Ditahan',
                'jenis_akun' => 'modal',
                'sub_jenis' => 'laba_ditahan',
                'saldo_normal' => 'kredit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Laba yang tidak dibagikan'
            ],

            // PENDAPATAN
            [
                'kode_akun' => '4000',
                'nama_akun' => 'PENDAPATAN',
                'jenis_akun' => 'pendapatan',
                'sub_jenis' => 'pendapatan_usaha',
                'saldo_normal' => 'kredit',
                'level' => 1,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Pendapatan'
            ],
            [
                'kode_akun' => '4100',
                'nama_akun' => 'Pendapatan Jasa Medis',
                'jenis_akun' => 'pendapatan',
                'sub_jenis' => 'pendapatan_usaha',
                'saldo_normal' => 'kredit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Pendapatan dari jasa medis'
            ],
            [
                'kode_akun' => '4101',
                'nama_akun' => 'Pendapatan Konsultasi',
                'jenis_akun' => 'pendapatan',
                'sub_jenis' => 'pendapatan_usaha',
                'saldo_normal' => 'kredit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Pendapatan konsultasi dokter'
            ],
            [
                'kode_akun' => '4102',
                'nama_akun' => 'Pendapatan Laboratorium',
                'jenis_akun' => 'pendapatan',
                'sub_jenis' => 'pendapatan_usaha',
                'saldo_normal' => 'kredit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Pendapatan jasa laboratorium'
            ],
            [
                'kode_akun' => '4200',
                'nama_akun' => 'Pendapatan Farmasi',
                'jenis_akun' => 'pendapatan',
                'sub_jenis' => 'pendapatan_usaha',
                'saldo_normal' => 'kredit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Pendapatan penjualan obat'
            ],

            // BEBAN
            [
                'kode_akun' => '5000',
                'nama_akun' => 'BEBAN',
                'jenis_akun' => 'beban',
                'sub_jenis' => 'beban_usaha',
                'saldo_normal' => 'debit',
                'level' => 1,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Beban'
            ],
            [
                'kode_akun' => '5100',
                'nama_akun' => 'Beban Operasional',
                'jenis_akun' => 'beban',
                'sub_jenis' => 'beban_usaha',
                'saldo_normal' => 'debit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Kelompok Beban Operasional'
            ],
            [
                'kode_akun' => '5101',
                'nama_akun' => 'Beban Gaji',
                'jenis_akun' => 'beban',
                'sub_jenis' => 'beban_usaha',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Beban gaji karyawan'
            ],
            [
                'kode_akun' => '5102',
                'nama_akun' => 'Beban Listrik',
                'jenis_akun' => 'beban',
                'sub_jenis' => 'beban_usaha',
                'saldo_normal' => 'debit',
                'level' => 3,
                'is_aktif' => true,
                'keterangan' => 'Beban listrik'
            ],
            [
                'kode_akun' => '5200',
                'nama_akun' => 'Harga Pokok Penjualan',
                'jenis_akun' => 'beban',
                'sub_jenis' => 'harga_pokok_penjualan',
                'saldo_normal' => 'debit',
                'level' => 2,
                'is_aktif' => true,
                'keterangan' => 'Harga pokok penjualan obat'
            ],
        ];

        // Create accounts with parent-child relationships
        $createdAccounts = [];
        
        foreach ($akun as $item) {
            $account = DaftarAkun::firstOrCreate(
                ['kode_akun' => $item['kode_akun']],
                $item
            );
            $createdAccounts[$item['kode_akun']] = $account;
        }

        // Set parent relationships
        $relationships = [
            '1100' => '1000', // Aset Lancar -> Aset
            '1101' => '1100', // Kas -> Aset Lancar
            '1102' => '1100', // Bank -> Aset Lancar
            '1103' => '1100', // Piutang -> Aset Lancar
            '1104' => '1100', // Persediaan Obat -> Aset Lancar
            '1105' => '1100', // Persediaan Alat Medis -> Aset Lancar
            '1200' => '1000', // Aset Tetap -> Aset
            '1201' => '1200', // Peralatan Medis -> Aset Tetap
            '1202' => '1200', // Gedung -> Aset Tetap
            
            '2100' => '2000', // Kewajiban Lancar -> Kewajiban
            '2101' => '2100', // Hutang Usaha -> Kewajiban Lancar
            '2102' => '2100', // Hutang Gaji -> Kewajiban Lancar
            
            '3100' => '3000', // Modal Pemilik -> Modal
            '3200' => '3000', // Laba Ditahan -> Modal
            
            '4100' => '4000', // Pendapatan Jasa Medis -> Pendapatan
            '4101' => '4100', // Pendapatan Konsultasi -> Pendapatan Jasa Medis
            '4102' => '4100', // Pendapatan Lab -> Pendapatan Jasa Medis
            '4200' => '4000', // Pendapatan Farmasi -> Pendapatan
            
            '5100' => '5000', // Beban Operasional -> Beban
            '5101' => '5100', // Beban Gaji -> Beban Operasional
            '5102' => '5100', // Beban Listrik -> Beban Operasional
            '5200' => '5000', // HPP -> Beban
        ];

        foreach ($relationships as $childCode => $parentCode) {
            if (isset($createdAccounts[$childCode]) && isset($createdAccounts[$parentCode])) {
                $createdAccounts[$childCode]->update([
                    'induk_akun_id' => $createdAccounts[$parentCode]->id
                ]);
            }
        }

        $this->command->info('Daftar Akun created successfully!');
    }
}
