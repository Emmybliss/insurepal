<?php

namespace App\Policies;

use App\Models\DebitNote;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\Gate;

class DebitNotePolicy
{
    use HandlesAuthorization;

    public function view(User $user, DebitNote $debitNote): bool
    {
        Gate::authorize('tenant-access', $debitNote);

        return $user->can('view_debit_notes');
    }

    public function create(User $user): bool
    {
        return $user->can('create_debit_notes');
    }

    public function update(User $user, DebitNote $debitNote): bool
    {
        Gate::authorize('tenant-access', $debitNote);

        return $user->can('edit_debit_notes') && $debitNote->status === DebitNote::STATUS_DRAFT;
    }

    public function delete(User $user, DebitNote $debitNote): bool
    {
        Gate::authorize('tenant-access', $debitNote);

        return $user->can('delete_debit_notes') && $debitNote->status === DebitNote::STATUS_DRAFT;
    }

    public function issue(User $user, DebitNote $debitNote): bool
    {
        Gate::authorize('tenant-access', $debitNote);

        return $user->can('issue_debit_notes');
    }

    public function cancel(User $user, DebitNote $debitNote): bool
    {
        Gate::authorize('tenant-access', $debitNote);

        return $user->can('cancel_debit_notes');
    }

    public function markPaid(User $user, DebitNote $debitNote): bool
    {
        Gate::authorize('tenant-access', $debitNote);

        return $user->can('mark_debit_notes_as_paid');
    }
}
