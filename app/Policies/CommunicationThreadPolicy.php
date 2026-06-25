<?php

namespace App\Policies;

use App\Models\CommunicationThread;
use App\Models\User;

class CommunicationThreadPolicy
{
    public function view(User $user, CommunicationThread $thread): bool
    {
        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        return $thread->isParticipant($user->id);
    }

    public function create(User $user): bool
    {
        return $user->is_active;
    }

    public function update(User $user, CommunicationThread $thread): bool
    {
        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        if (! $thread->isParticipant($user->id)) {
            return false;
        }

        return $thread->created_by === $user->id
            || $thread->assigned_to === $user->id
            || $user->can('edit_conversations');
    }

    public function delete(User $user, CommunicationThread $thread): bool
    {
        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        if (! $thread->isParticipant($user->id)) {
            return false;
        }

        return $thread->created_by === $user->id
            || $user->can('delete_conversations');
    }

    public function send(User $user, CommunicationThread $thread): bool
    {
        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        return $thread->isParticipant($user->id);
    }

    public function assign(User $user, CommunicationThread $thread): bool
    {
        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        if (! $user->can('assign_conversations')) {
            return false;
        }

        return $thread->created_by === $user->id
            || $thread->assigned_to === $user->id
            || $user->can('assign_conversations');
    }

    public function resolve(User $user, CommunicationThread $thread): bool
    {
        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        if (! $user->can('edit_conversations')) {
            return false;
        }

        return $thread->status !== 'resolved'
            && $thread->status !== 'closed';
    }

    public function archive(User $user, CommunicationThread $thread): bool
    {
        if ((int) $user->tenant_id !== (int) $thread->tenant_id) {
            return false;
        }

        return $thread->isParticipant($user->id);
    }
}
