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

class ApprovalApproved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Approval $approval
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->approval->requested_by}"),
            new PrivateChannel("approval.{$this->approval->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'approval.approved';
    }

    public function broadcastWith(): array
    {
        return [
            'approval' => [
                'id' => $this->approval->id,
                'approval_type' => $this->approval->approval_type,
                'status' => $this->approval->status,
                'amount' => $this->approval->amount,
                'approved_at' => $this->approval->approved_at?->format('c'),
                'approval_notes' => $this->approval->approval_notes,
                'approved_by' => [
                    'id' => $this->approval->approvedBy->id,
                    'name' => $this->approval->approvedBy->name,
                ],
                'approvable' => [
                    'type' => $this->approval->approvable_type,
                    'id' => $this->approval->approvable_id,
                ],
            ],
        ];
    }
}
