<?php

namespace App\Services;

use App\Events\CommunicationStatusChanged;
use App\Models\CommunicationMessage;
use App\Models\CommunicationParticipant;
use App\Models\CommunicationThread;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CommunicationThreadService
{
    public function createEmailThread(User $creator, array $data): CommunicationThread
    {
        $thread = CommunicationThread::create([
            'tenant_id' => $creator->tenant_id,
            'created_by' => $creator->id,
            'mode' => 'email',
            'type' => $data['type'] ?? 'general',
            'subject' => $data['subject'],
            'priority' => $data['priority'] ?? 'normal',
            'status' => 'open',
            'assigned_to' => $data['assignee_id'] ?? null,
            'related_type' => $data['related_type'] ?? null,
            'related_id' => $data['related_id'] ?? null,
            'metadata' => $data['metadata'] ?? null,
        ]);

        $this->addParticipant($thread, $creator, 'sender');

        foreach ($data['recipients'] ?? [] as $recipientId) {
            $this->addParticipant($thread, User::find($recipientId), 'recipient');
        }

        if (isset($data['cc'])) {
            foreach ($data['cc'] as $ccId) {
                $this->addParticipant($thread, User::find($ccId), 'cc');
            }
        }

        if (isset($data['bcc'])) {
            foreach ($data['bcc'] as $bccId) {
                $this->addParticipant($thread, User::find($bccId), 'bcc');
            }
        }

        if (isset($data['initial_message'])) {
            $this->sendMessage($thread, $creator, $data['initial_message']);
        }

        return $thread->load(['creator', 'participants.user', 'assignee']);
    }

    public function getUserThreads(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = CommunicationThread::query()
            ->where('tenant_id', $user->tenant_id)
            ->whereExists(function ($q) use ($user) {
                $q->select(DB::raw(1))
                    ->from('communication_participants as p')
                    ->whereRaw('p.communication_thread_id = communication_threads.id')
                    ->where('p.user_id', $user->id)
                    ->whereNull('p.deleted_at');
            })
            ->with(['creator', 'assignee', 'latestMessage.sender', 'participants.user'])
            ->orderBy('last_message_at', 'desc');

        if (isset($filters['mode'])) {
            $query->where('mode', $filters['mode']);
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('subject', 'like', '%'.$filters['search'].'%')
                    ->orWhereHas('messages', fn ($mq) => $mq->where('body', 'like', '%'.$filters['search'].'%'));
            });
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getThreadStats(User $user): array
    {
        $baseQuery = CommunicationThread::query()
            ->where('tenant_id', $user->tenant_id)
            ->whereExists(function ($q) use ($user) {
                $q->select(DB::raw(1))
                    ->from('communication_participants as p')
                    ->whereRaw('p.communication_thread_id = communication_threads.id')
                    ->where('p.user_id', $user->id)
                    ->whereNull('p.deleted_at');
            });

        return [
            'total' => $baseQuery->count(),
            'unread' => $baseQuery->clone()->whereHas('messages', fn ($q) => $q
                ->where('sender_id', '!=', $user->id)
                ->whereDoesntHave('readReceipts', fn ($r) => $r->where('user_id', $user->id))
            )->count(),
            'assigned_to_me' => $baseQuery->clone()->where('assigned_to', $user->id)->count(),
            'by_status' => $baseQuery->clone()->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'by_mode' => $baseQuery->clone()->selectRaw('mode, count(*) as count')
                ->groupBy('mode')
                ->pluck('count', 'mode')
                ->toArray(),
        ];
    }

    public function addParticipant(CommunicationThread $thread, User $user, string $role = 'participant'): CommunicationParticipant
    {
        return CommunicationParticipant::firstOrCreate(
            ['communication_thread_id' => $thread->id, 'user_id' => $user->id],
            ['role' => $role, 'joined_at' => now()]
        );
    }

    public function removeParticipant(CommunicationThread $thread, User $user): void
    {
        CommunicationParticipant::where('communication_thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->update(['deleted_at' => now()]);
    }

    public function assignThread(CommunicationThread $thread, User $assignee): void
    {
        $thread->update([
            'assigned_to' => $assignee->id,
            'status' => 'assigned',
        ]);

        $this->addParticipant($thread, $assignee, 'assignee');

        event(new CommunicationStatusChanged($thread, 'assigned'));
    }

    public function updateStatus(CommunicationThread $thread, string $status): void
    {
        $oldStatus = $thread->status;
        $thread->update(['status' => $status]);

        event(new CommunicationStatusChanged($thread, $status, $oldStatus));
    }

    public function markAsRead(CommunicationThread $thread, User $user): void
    {
        $participant = CommunicationParticipant::where('communication_thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->first();

        if ($participant) {
            $participant->update(['last_read_at' => now()]);
        }

        $thread->typedMessages()
            ->where('sender_id', '!=', $user->id)
            ->get()
            ->each(fn ($message) => $message->markAsReadBy($user->id));
    }

    public function getUnreadCount(CommunicationThread $thread, User $user): int
    {
        return $thread->getUnreadCountForUser($user->id);
    }

    public function getInboxFolder(User $user, string $folder, array $filters = []): LengthAwarePaginator
    {
        $query = CommunicationThread::query()
            ->where('tenant_id', $user->tenant_id)
            ->where('mode', 'email')
            ->with(['creator', 'latestMessage.sender', 'participants.user'])
            ->orderBy('last_message_at', 'desc');

        switch ($folder) {
            case 'inbox':
                $query->whereExists(function ($q) use ($user) {
                    $q->select(DB::raw(1))
                        ->from('communication_participants as p')
                        ->whereRaw('p.communication_thread_id = communication_threads.id')
                        ->where('p.user_id', $user->id)
                        ->whereIn('p.role', ['recipient', 'cc', 'bcc'])
                        ->whereNull('p.deleted_at');
                });
                break;

            case 'sent':
                $query->whereExists(function ($q) use ($user) {
                    $q->select(DB::raw(1))
                        ->from('communication_participants as p')
                        ->whereRaw('p.communication_thread_id = communication_threads.id')
                        ->where('p.user_id', $user->id)
                        ->where('p.role', 'sender');
                })->whereHas('messages', fn ($mq) => $mq
                    ->where('sender_id', $user->id)
                    ->whereNotNull('sent_at')
                );
                break;

            case 'drafts':
                $query->whereExists(function ($q) use ($user) {
                    $q->select(DB::raw(1))
                        ->from('communication_participants as p')
                        ->whereRaw('p.communication_thread_id = communication_threads.id')
                        ->where('p.user_id', $user->id)
                        ->where('p.role', 'sender');
                })->whereHas('messages', fn ($mq) => $mq->where('is_draft', true));
                break;

            case 'unread':
                $query->whereExists(function ($q) use ($user) {
                    $q->select(DB::raw(1))
                        ->from('communication_participants as p')
                        ->whereRaw('p.communication_thread_id = communication_threads.id')
                        ->where('p.user_id', $user->id)
                        ->whereIn('p.role', ['sender', 'recipient', 'cc', 'bcc'])
                        ->whereNull('p.deleted_at')
                        ->whereNull('p.last_read_at');
                });
                break;
        }

        if (isset($filters['search'])) {
            $query->where('subject', 'like', '%'.$filters['search'].'%');
        }

        return $query->paginate(20);
    }

    private function sendMessage(CommunicationThread $thread, User $sender, string $body): CommunicationMessage
    {
        $service = app(CommunicationMessageService::class);

        return $service->sendMessage($thread, $sender, $body);
    }
}
