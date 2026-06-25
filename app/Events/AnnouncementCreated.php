<?php

namespace App\Events;

use App\Models\Announcement;
use App\Models\Tenant;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Announcement $announcement,
        public Tenant $tenant
    ) {
        //
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('tenant.'.$this->tenant->id.'.announcements'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->announcement->id,
            'title' => $this->announcement->title,
            'content' => $this->announcement->content,
            'priority' => $this->announcement->priority,
            'type' => $this->announcement->type,
            'expires_at' => $this->announcement->expires_at?->toISOString(),
            'created_at' => $this->announcement->created_at->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'announcement.created';
    }
}
