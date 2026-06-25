<?php

namespace App\Services;

use App\Events\CommunicationMessageSent;
use App\Models\CommunicationAttachment;
use App\Models\CommunicationMessage;
use App\Models\CommunicationThread;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

class CommunicationMessageService
{
    public function sendMessage(
        CommunicationThread $thread,
        User $sender,
        string $body,
        array $attachments = []
    ): CommunicationMessage {
        $message = CommunicationMessage::create([
            'thread_id' => $thread->id,
            'sender_id' => $sender->id,
            'body' => $body,
            'body_type' => 'plain',
            'is_draft' => false,
            'sent_at' => now(),
        ]);

        $thread->update(['last_message_at' => now()]);

        foreach ($attachments as $attachment) {
            $this->attachFile($message, $attachment);
        }

        event(new CommunicationMessageSent($message, $sender));

        return $message->load(['sender', 'attachments']);
    }

    public function saveDraft(
        CommunicationThread $thread,
        User $sender,
        array $data
    ): CommunicationMessage {
        $message = CommunicationMessage::create([
            'thread_id' => $thread->id,
            'sender_id' => $sender->id,
            'body' => $data['body'],
            'body_type' => $data['body_type'] ?? 'plain',
            'is_draft' => true,
            'sent_at' => null,
        ]);

        if (isset($data['attachments'])) {
            foreach ($data['attachments'] as $attachment) {
                $this->attachFile($message, $attachment);
            }
        }

        return $message;
    }

    public function sendDraft(CommunicationMessage $draft): CommunicationMessage
    {
        $draft->update([
            'is_draft' => false,
            'sent_at' => now(),
        ]);

        $thread = $draft->thread;
        $thread->update(['last_message_at' => now()]);

        event(new CommunicationMessageSent($draft, $draft->sender));

        return $draft->load(['sender', 'attachments']);
    }

    public function editDraft(CommunicationMessage $draft, array $data): CommunicationMessage
    {
        $draft->update([
            'body' => $data['body'],
            'body_type' => $data['body_type'] ?? 'plain',
        ]);

        return $draft;
    }

    public function deleteMessage(CommunicationMessage $message): void
    {
        $message->attachments()->each(fn ($att) => $this->deleteAttachment($att));
        $message->delete();
    }

    public function searchMessages(User $user, string $query): LengthAwarePaginator
    {
        return CommunicationMessage::query()
            ->whereHas('thread', fn ($tq) => $tq
                ->where('tenant_id', $user->tenant_id)
                ->whereHas('participants', fn ($pq) => $pq->where('user_id', $user->id))
            )
            ->with(['sender', 'thread', 'attachments'])
            ->where('body', 'like', '%'.$query.'%')
            ->where('is_draft', false)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
    }

    public function attachFile(CommunicationMessage $message, UploadedFile $file): CommunicationAttachment
    {
        $path = $file->store('communication-attachments', 'public');

        return CommunicationAttachment::create([
            'message_id' => $message->id,
            'disk' => 'public',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);
    }

    public function deleteAttachment(CommunicationAttachment $attachment): void
    {
        Storage::disk($attachment->disk)->delete($attachment->path);
        $attachment->delete();
    }

    public function markAsRead(CommunicationMessage $message, User $user): void
    {
        $message->markAsReadBy($user->id);

        $participant = $message->thread->participants()
            ->where('user_id', $user->id)
            ->first();

        if ($participant) {
            $participant->markAsRead();
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

    public function getThreadMessages(CommunicationThread $thread): \Illuminate\Database\Eloquent\Collection
    {
        return $thread->messages()
            ->where('is_draft', false)
            ->with(['sender', 'attachments'])
            ->orderBy('created_at')
            ->get();
    }

    public function isReadBy(CommunicationMessage $message, User $user): bool
    {
        return $message->isReadBy($user->id);
    }

    public function bulkMarkAsRead(CommunicationThread $thread, User $user, array $messageIds): void
    {
        $thread->messages()
            ->whereIn('id', $messageIds)
            ->where('sender_id', '!=', $user->id)
            ->get()
            ->each(fn ($message) => $message->markAsReadBy($user->id));
    }
}
