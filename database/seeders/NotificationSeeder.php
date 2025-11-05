<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please seed users first.');
            return;
        }

        $notifications = [
            [
                'type' => 'closing_period',
                'title' => 'Periode Akuntansi Januari 2025 Ditutup',
                'message' => 'Periode akuntansi untuk bulan Januari 2025 telah ditutup. Transaksi pada periode ini memerlukan persetujuan revisi.',
                'action_url' => '/settings/closing-periods',
            ],
            [
                'type' => 'revision_approval',
                'title' => 'Ada Permintaan Revisi Jurnal',
                'message' => 'Permintaan revisi untuk Jurnal Umum #JU-2025-001 dengan nilai Rp 5.000.000 menunggu persetujuan Anda.',
                'action_url' => '/settings/revision-approvals',
            ],
            [
                'type' => 'period_reminder',
                'title' => 'Pengingat: Periode Akuntansi Akan Ditutup',
                'message' => 'Periode akuntansi Februari 2025 akan ditutup dalam 7 hari. Pastikan semua transaksi telah dicatat.',
                'action_url' => '/settings/closing-periods',
            ],
            [
                'type' => 'revision_approval',
                'title' => 'Revisi Jurnal Disetujui',
                'message' => 'Permintaan revisi untuk Jurnal Penyesuaian #JP-2025-003 telah disetujui oleh Supervisor.',
                'action_url' => '/akuntansi/jurnal-penyesuaian',
            ],
            [
                'type' => 'system',
                'title' => 'Sistem Berhasil Diperbarui',
                'message' => 'Sistem akuntansi telah diperbarui dengan fitur baru: Notifikasi In-App dan peningkatan performa.',
                'action_url' => null,
            ],
            [
                'type' => 'closing_period',
                'title' => 'Periode Q1 2025 Soft Close',
                'message' => 'Periode Q1 2025 memasuki tahap soft close. Transaksi masih dapat dibuat dengan approval.',
                'action_url' => '/settings/closing-periods',
            ],
            [
                'type' => 'period_reminder',
                'title' => 'Deadline Tutup Buku Mendekat',
                'message' => 'Tutup buku bulan ini akan dilaksanakan dalam 3 hari. Mohon segera selesaikan semua proses rekonsiliasi.',
                'action_url' => '/settings/closing-periods',
            ],
        ];

        foreach ($users as $user) {
            foreach ($notifications as $index => $notification) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => $notification['type'],
                    'title' => $notification['title'],
                    'message' => $notification['message'],
                    'action_url' => $notification['action_url'],
                    'data' => null,
                    'read_at' => $index > 3 ? null : now()->subDays(rand(1, 5)), // First 4 read, last 3 unread
                    'created_at' => now()->subDays(7 - $index),
                ]);
            }
        }

        $this->command->info('Created ' . (count($notifications) * $users->count()) . ' notifications for ' . $users->count() . ' users.');
    }
}
