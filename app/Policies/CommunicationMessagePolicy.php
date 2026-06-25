<?php

namespace App\Policies;

use App\Models\CommunicationMessage;
use App\Models\User;

class CommunicationMessagePolicy
{
    public function view(User $user, CommunicationMessage $message): bool
    {
        $thread = $message->thread;

        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        return $thread->isParticipant($user->id);
    }

    public function create(User $user, CommunicationMessage $message): bool
    {
        $thread = $message->thread;

        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        return $thread->isParticipant($user->id);
    }

    public function delete(User $user, CommunicationMessage $message): bool
    {
        $thread = $message->thread;

        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        return $message->sender_id === $user->id
            || $thread->created_by === $user->id
            || $user->can('delete_conversations');
    }

    public function edit(User $user, CommunicationMessage $message): bool
    {
        if ($message->is_draft === false) {
            return false;
        }

        $thread = $message->thread;

        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        return $message->sender_id === $user->id;
    }
}
