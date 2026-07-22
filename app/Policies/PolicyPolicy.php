<?php

namespace App\Policies;

use App\Models\Policy;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\Gate;

class PolicyPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Policy $policy): bool
    {
        Gate::authorize('tenant-access', $policy);

        return $user->can('view_policies');
    }

    public function create(User $user): bool
    {
        return $user->can('create_policies');
    }

    public function update(User $user, Policy $policy): bool
    {
        Gate::authorize('tenant-access', $policy);

        return $user->can('edit_policies') && $policy->isDraft();
    }

    public function delete(User $user, Policy $policy): bool
    {
        Gate::authorize('tenant-access', $policy);

        return $user->can('delete_policies') && $policy->isDraft();
    }

    public function approve(User $user, Policy $policy): bool
    {
        Gate::authorize('tenant-access', $policy);

        return $user->can('approve_policies') && $policy->isPendingApproval();
    }

    public function reject(User $user, Policy $policy): bool
    {
        Gate::authorize('tenant-access', $policy);

        return $user->can('reject_policies') && $policy->isPendingApproval();
    }

    public function issue(User $user, Policy $policy): bool
    {
        Gate::authorize('tenant-access', $policy);

        return $user->can('issue_policies') && $policy->canBeIssued();
    }

    public function cancel(User $user, Policy $policy): bool
    {
        Gate::authorize('tenant-access', $policy);

        return $user->can('cancel_policies') && $policy->canBeCancelled();
    }
}
