<?php

namespace App\Events;

use App\Models\Approval;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApprovalRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Approval $approval
    ) {}

    public function broadcastOn(): array
    {
        // Broadcast to specific users who can approve
        $channels = [];
        
        // Broadcast to all users with approval permission
        $approverRoles = $this->approval->approval_rules['approver_roles'] ?? [];
        
        foreach ($approverRoles as $role) {
            $channels[] = new PrivateChannel("approval.{$role}");
        }
        
        // Also broadcast to the requester
        $channels[] = new PrivateChannel("user.{$this->approval->requested_by}");
        
        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'approval.requested';
    }

    public function broadcastWith(): array
    {
        return [
            'approval' => [
                'id' => $this->approval->id,
                'approval_type' => $this->approval->approval_type,
                'status' => $this->approval->status,
                'amount' => $this->approval->amount,
                'expires_at' => $this->approval->expires_at?->format('c'),
                'request_notes' => $this->approval->request_notes,
                'requested_by' => [
                    'id' => $this->approval->requestedBy->id,
                    'name' => $this->approval->requestedBy->name,
                ],
                'approvable' => [
                    'type' => $this->approval->approvable_type,
                    'id' => $this->approval->approvable_id,
                    'display_name' => $this->getApprovableDisplayName(),
                ],
            ],
        ];
    }

    private function getApprovableDisplayName(): string
    {
        $approvable = $this->approval->approvable;
        
        if (method_exists($approvable, 'getDisplayName')) {
            return $approvable->getDisplayName();
        }
        
        // Fallback display names
        return match ($this->approval->approvable_type) {
            'App\Models\Kas\CashTransaction' => "Transaksi Kas #{$approvable->nomor_transaksi}",
            'App\Models\Kas\BankTransaction' => "Transaksi Bank #{$approvable->nomor_transaksi}",
            'App\Models\Kas\GiroTransaction' => "Transaksi Giro #{$approvable->nomor_giro}",
            default => "Transaksi #{$approvable->id}",
        };
    }
}
