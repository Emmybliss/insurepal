<?php

namespace App\Policies;

use App\Models\Placement;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\Gate;

class PlacementPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Placement $placement): bool
    {
        Gate::authorize('tenant-access', $placement);

        return $user->can('view_placements');
    }

    public function create(User $user): bool
    {
        return $user->can('create_placements');
    }

    public function update(User $user, Placement $placement): bool
    {
        Gate::authorize('tenant-access', $placement);

        return $user->can('edit_placements');
    }

    public function delete(User $user, Placement $placement): bool
    {
        Gate::authorize('tenant-access', $placement);

        return $user->can('delete_placements');
    }

    public function submit(User $user, Placement $placement): bool
    {
        Gate::authorize('tenant-access', $placement);

        return $user->can('submit_placements');
    }
}
