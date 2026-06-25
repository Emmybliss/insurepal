<?php

namespace App\Events;

use App\Models\CommunicationThread;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunicationThreadUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public CommunicationThread $thread,
        public ?string $field = null
    ) {
        //
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('threads.'.$this->thread->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'thread_id' => $this->thread->id,
            'field' => $this->field,
            'subject' => $this->thread->subject,
            'status' => $this->thread->status,
            'priority' => $this->thread->priority,
            'assigned_to' => $this->thread->assigned_to,
            'updated_at' => $this->thread->updated_at->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'communication.thread.updated';
    }
}
