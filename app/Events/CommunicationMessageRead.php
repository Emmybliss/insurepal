<?php

namespace App\Events;

use App\Models\CommunicationMessage;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunicationMessageRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public CommunicationMessage $message,
        public User $user
    ) {
        //
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('threads.'.$this->message->thread_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->message->id,
            'thread_id' => $this->message->thread_id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'read_at' => now()->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'communication.message.read';
    }
}
