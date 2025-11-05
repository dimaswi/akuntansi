<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Role;

class NotificationService
{
    /**
     * Notification types
     */
    const TYPE_KAS_POST = 'kas_post_to_jurnal';
    const TYPE_JURNAL_CREATED = 'jurnal_created';
    const TYPE_CLOSING_PERIOD = 'closing_period';
    const TYPE_REVISION_APPROVAL = 'revision_approval';
    const TYPE_PERIOD_REMINDER = 'period_reminder';
    const TYPE_SYSTEM = 'system';

    /**
     * Send notification to ALL users whose roles have this notification type enabled
     * This checks EVERY role's notification_settings automatically
     */
    public function sendToAllRoles(string $type, array $data): void
    {
        // Get ALL roles
        $roles = Role::all();
        
        $userIds = [];
        foreach ($roles as $role) {
            // Only include users from roles that have this notification enabled
            if ($role->shouldReceiveNotification($type)) {
                $userIds = array_merge($userIds, $role->users()->pluck('id')->toArray());
            }
        }

        if (empty($userIds)) {
            return;
        }

        $userIds = array_unique($userIds);
        
        foreach ($userIds as $userId) {
            $this->create($userId, $type, $data);
        }
    }

    /**
     * Send notification to users with specific roles that have this notification enabled
     * Use this only if you need to limit to specific roles
     */
    public function sendToRoles(string $type, array $roleNames, array $data): void
    {
        $roles = Role::whereIn('name', $roleNames)->get();
        
        $userIds = [];
        foreach ($roles as $role) {
            if ($role->shouldReceiveNotification($type)) {
                $userIds = array_merge($userIds, $role->users()->pluck('id')->toArray());
            }
        }

        if (empty($userIds)) {
            return;
        }

        $userIds = array_unique($userIds);
        
        foreach ($userIds as $userId) {
            $this->create($userId, $type, $data);
        }
    }

    /**
     * Send notification to specific user
     */
    public function sendToUser(int $userId, string $type, array $data): void
    {
        $this->create($userId, $type, $data);
    }

    /**
     * Send notification to multiple users
     */
    public function sendToUsers(array $userIds, string $type, array $data): void
    {
        foreach ($userIds as $userId) {
            $this->create($userId, $type, $data);
        }
    }

    /**
     * Create notification
     */
    private function create(int $userId, string $type, array $data): void
    {
        Notification::create([
            'user_id' => $userId,
            'type' => $this->mapTypeToNotificationType($type),
            'title' => $data['title'],
            'message' => $data['message'],
            'data' => $data['data'] ?? null,
            'action_url' => $data['action_url'] ?? null,
        ]);
    }

    /**
     * Map internal type to notification type enum
     */
    private function mapTypeToNotificationType(string $type): string
    {
        return match($type) {
            self::TYPE_KAS_POST => 'system',
            self::TYPE_JURNAL_CREATED => 'system',
            self::TYPE_CLOSING_PERIOD => 'closing_period',
            self::TYPE_REVISION_APPROVAL => 'revision_approval',
            self::TYPE_PERIOD_REMINDER => 'period_reminder',
            default => 'system',
        };
    }

    /**
     * Get all available notification types
     */
    public static function getAvailableTypes(): array
    {
        return [
            self::TYPE_KAS_POST => 'Transaksi Kas Post to Jurnal',
            self::TYPE_JURNAL_CREATED => 'Pembuatan Jurnal Baru',
            self::TYPE_CLOSING_PERIOD => 'Closing Period',
            self::TYPE_REVISION_APPROVAL => 'Persetujuan Revisi',
            self::TYPE_PERIOD_REMINDER => 'Pengingat Periode',
            self::TYPE_SYSTEM => 'Notifikasi Sistem',
        ];
    }
}
