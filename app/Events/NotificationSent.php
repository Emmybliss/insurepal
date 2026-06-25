<?php

namespace App\Events;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NotificationSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    private const SAFE_DATA_FIELDS = ['url', 'icon', 'action_type', 'customer_id', 'policy_id', 'claim_id'];

    public function __construct(
        public Notification $notification,
        public User $user
    ) {
        Log::debug('NotificationSent event created', [
            'notification_id' => $this->notification->id,
            'user_id' => $this->user->id,
            'tenant_id' => $this->user->tenant_id,
            'channel' => 'tenant.'.$this->user->tenant_id.'.notifications.'.$this->user->id,
        ]);
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('tenant.'.$this->user->tenant_id.'.notifications.'.$this->user->id),
        ];

        Log::debug('Broadcasting on channels', [
            'channels' => array_map(fn ($c) => $c->name, $channels),
        ]);

        return $channels;
    }

    public function broadcastWith(): array
    {
        $safeData = $this->filterSafeData($this->notification->data);

        return [
            'id' => $this->notification->id,
            'type' => $this->notification->type,
            'title' => $this->notification->title,
            'message' => $this->notification->message,
            'data' => $safeData,
            'priority' => $this->notification->priority,
            'read_at' => $this->notification->read_at?->toISOString(),
            'created_at' => $this->notification->created_at->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.sent';
    }

    private function filterSafeData(?array $data): array
    {
        if (empty($data)) {
            return [];
        }

        return collect($data)
            ->only(self::SAFE_DATA_FIELDS)
            ->toArray();
    }
}
