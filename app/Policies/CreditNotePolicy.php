<?php

namespace App\Policies;

use App\Models\CreditNote;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\Gate;

class CreditNotePolicy
{
    use HandlesAuthorization;

    public function view(User $user, CreditNote $creditNote): bool
    {
        Gate::authorize('tenant-access', $creditNote);

        return $user->can('view_credit_notes');
    }

    public function create(User $user): bool
    {
        return $user->can('create_credit_notes');
    }

    public function update(User $user, CreditNote $creditNote): bool
    {
        Gate::authorize('tenant-access', $creditNote);

        return $user->can('edit_credit_notes') && $creditNote->status === CreditNote::STATUS_DRAFT;
    }

    public function delete(User $user, CreditNote $creditNote): bool
    {
        Gate::authorize('tenant-access', $creditNote);

        return $user->can('delete_credit_notes') && $creditNote->status === CreditNote::STATUS_DRAFT;
    }

    public function issue(User $user, CreditNote $creditNote): bool
    {
        Gate::authorize('tenant-access', $creditNote);

        return $user->can('issue_credit_notes');
    }

    public function cancel(User $user, CreditNote $creditNote): bool
    {
        Gate::authorize('tenant-access', $creditNote);

        return $user->can('cancel_credit_notes');
    }
}
