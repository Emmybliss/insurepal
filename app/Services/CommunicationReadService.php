<?php

namespace App\Services;

use App\Models\CommunicationMessage;
use App\Models\CommunicationParticipant;
use App\Models\CommunicationReadReceipt;
use App\Models\CommunicationThread;
use App\Models\User;

class CommunicationReadService
{
    public function markMessageAsRead(CommunicationMessage $message, User $user): void
    {
        CommunicationReadReceipt::updateOrCreate(
            ['message_id' => $message->id, 'user_id' => $user->id],
            ['read_at' => now(), 'delivered_at' => $message->created_at]
        );

        $participant = CommunicationParticipant::where('communication_thread_id', $message->thread_id)
            ->where('user_id', $user->id)
            ->first();

        if ($participant) {
            $participant->update(['last_read_at' => now()]);
        }
    }

    public function markThreadAsRead(CommunicationThread $thread, User $user): void
    {
        $thread->typedMessages()
            ->where('sender_id', '!=', $user->id)
            ->whereDoesntHave('readReceipts', fn ($q) => $q->where('user_id', $user->id))
            ->get()
            ->each(fn ($message) => $this->markMessageAsRead($message, $user));

        $participant = CommunicationParticipant::where('communication_thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->first();

        if ($participant) {
            $participant->update(['last_read_at' => now()]);
        }
    }

    public function getReadStatus(CommunicationMessage $message): array
    {
        return $message->readReceipts()
            ->with('user')
            ->get()
            ->map(fn ($receipt) => [
                'user_id' => $receipt->user_id,
                'user_name' => $receipt->user->name,
                'read_at' => $receipt->read_at?->toISOString(),
                'delivered_at' => $receipt->delivered_at?->toISOString(),
            ])
            ->toArray();
    }

    public function isReadBy(CommunicationMessage $message, User $user): bool
    {
        return $message->readReceipts()
            ->where('user_id', $user->id)
            ->whereNotNull('read_at')
            ->exists();
    }

    public function getUnreadRecipients(CommunicationMessage $message): array
    {
        $thread = $message->thread;
        $participantIds = $thread->participants()
            ->whereNull('deleted_at')
            ->pluck('user_id')
            ->toArray();

        $readUserIds = $message->readReceipts()
            ->whereNotNull('read_at')
            ->pluck('user_id')
            ->toArray();

        return array_values(array_diff($participantIds, $readUserIds));
    }

    public function getDeliveryStatus(CommunicationMessage $message): array
    {
        $thread = $message->thread;
        $participants = $thread->participants()
            ->whereNull('deleted_at')
            ->with('user')
            ->get();

        return $participants->map(fn ($participant) => [
            'user_id' => $participant->user_id,
            'user_name' => $participant->user->name,
            'role' => $participant->role,
            'read_at' => $message->readReceipts()
                ->where('user_id', $participant->user_id)
                ->first()?->read_at?->toISOString(),
            'delivered_at' => $message->readReceipts()
                ->where('user_id', $participant->user_id)
                ->first()?->delivered_at?->toISOString(),
        ])->toArray();
    }
}
