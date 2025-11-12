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
    
    // Inventory Accounting Types
    const TYPE_PURCHASE_POSTED = 'purchase_posted_to_jurnal';
    const TYPE_PAYMENT_CREATED = 'purchase_payment_created';
    const TYPE_PURCHASE_APPROVED = 'purchase_approved';
    const TYPE_PURCHASE_OUTSTANDING = 'purchase_outstanding_reminder';
    
    // Inventory Stock Management Types
    const TYPE_STOCK_TRANSFER_APPROVED = 'stock_transfer_approved';
    const TYPE_STOCK_TRANSFER_RECEIVED = 'stock_transfer_received';
    const TYPE_STOCK_USAGE_APPROVED = 'stock_usage_approved';
    const TYPE_STOCK_USAGE_POSTED = 'stock_usage_posted_to_jurnal';
    const TYPE_STOCK_REQUEST_SUBMITTED = 'stock_request_submitted';
    const TYPE_STOCK_REQUEST_APPROVED = 'stock_request_approved';
    const TYPE_STOCK_REQUEST_REJECTED = 'stock_request_rejected';
    const TYPE_STOCK_REQUEST_COMPLETED = 'stock_request_completed';
    const TYPE_STOCK_ADJUSTMENT_APPROVED = 'stock_adjustment_approved';
    const TYPE_STOCK_ADJUSTMENT_POSTED = 'stock_adjustment_posted_to_jurnal';
    const TYPE_LOW_STOCK_ALERT = 'low_stock_alert';
    const TYPE_STOCK_OPNAME_SUBMITTED = 'stock_opname_submitted';
    const TYPE_STOCK_OPNAME_APPROVED = 'stock_opname_approved';
    const TYPE_STOCK_OPNAME_REJECTED = 'stock_opname_rejected';
    const TYPE_STOCK_OPNAME_REMINDER = 'stock_opname_reminder';
    const TYPE_STOCK_OPNAME_ESCALATION = 'stock_opname_escalation';

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
     * Send notification to all users in a specific department
     */
    public function sendToDepartment(int $departmentId, string $type, array $data, ?int $excludeUserId = null): void
    {
        $users = \App\Models\User::where('department_id', $departmentId)
            ->where('is_active', true)
            ->when($excludeUserId, function ($query, $excludeUserId) {
                return $query->where('id', '!=', $excludeUserId);
            })
            ->pluck('id')
            ->toArray();

        $this->sendToUsers($users, $type, $data);
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
            self::TYPE_PURCHASE_POSTED => 'system',
            self::TYPE_PAYMENT_CREATED => 'system',
            self::TYPE_PURCHASE_APPROVED => 'system',
            self::TYPE_PURCHASE_OUTSTANDING => 'period_reminder',
            self::TYPE_STOCK_TRANSFER_APPROVED => 'system',
            self::TYPE_STOCK_TRANSFER_RECEIVED => 'system',
            self::TYPE_STOCK_USAGE_APPROVED => 'system',
            self::TYPE_STOCK_USAGE_POSTED => 'system',
            self::TYPE_STOCK_REQUEST_SUBMITTED => 'system',
            self::TYPE_STOCK_REQUEST_APPROVED => 'system',
            self::TYPE_STOCK_REQUEST_REJECTED => 'system',
            self::TYPE_STOCK_REQUEST_COMPLETED => 'system',
            self::TYPE_STOCK_ADJUSTMENT_APPROVED => 'system',
            self::TYPE_STOCK_ADJUSTMENT_POSTED => 'system',
            self::TYPE_LOW_STOCK_ALERT => 'period_reminder',
            self::TYPE_STOCK_OPNAME_SUBMITTED => 'system',
            self::TYPE_STOCK_OPNAME_APPROVED => 'system',
            self::TYPE_STOCK_OPNAME_REJECTED => 'system',
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
            self::TYPE_PURCHASE_POSTED => 'Purchase Order Posted to Journal',
            self::TYPE_PAYMENT_CREATED => 'Pembuatan Purchase Payment',
            self::TYPE_PURCHASE_APPROVED => 'Persetujuan Purchase Order',
            self::TYPE_PURCHASE_OUTSTANDING => 'Pengingat Purchase Outstanding',
            self::TYPE_STOCK_TRANSFER_APPROVED => 'Stock Transfer Disetujui',
            self::TYPE_STOCK_TRANSFER_RECEIVED => 'Stock Transfer Diterima',
            self::TYPE_STOCK_USAGE_APPROVED => 'Stock Usage Disetujui',
            self::TYPE_STOCK_USAGE_POSTED => 'Stock Usage Posted to Journal',
            self::TYPE_STOCK_REQUEST_SUBMITTED => 'Permintaan Stok Diajukan',
            self::TYPE_STOCK_REQUEST_APPROVED => 'Permintaan Stok Disetujui',
            self::TYPE_STOCK_REQUEST_REJECTED => 'Permintaan Stok Ditolak',
            self::TYPE_STOCK_REQUEST_COMPLETED => 'Permintaan Stok Selesai',
            self::TYPE_STOCK_ADJUSTMENT_APPROVED => 'Stock Adjustment Disetujui',
            self::TYPE_STOCK_ADJUSTMENT_POSTED => 'Stock Adjustment Posted to Journal',
            self::TYPE_LOW_STOCK_ALERT => 'Peringatan Stok Menipis',
            self::TYPE_SYSTEM => 'Notifikasi Sistem',
        ];
    }
}
