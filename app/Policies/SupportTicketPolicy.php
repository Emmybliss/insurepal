<?php

namespace App\Policies;

use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\Gate;

class SupportTicketPolicy
{
    use HandlesAuthorization;

    public function view(User $user, SupportTicket $supportTicket): bool
    {
        Gate::authorize('tenant-access', $supportTicket);

        return $user->can('view_support_tickets');
    }

    public function create(User $user): bool
    {
        return $user->can('create_support_tickets');
    }

    public function update(User $user, SupportTicket $supportTicket): bool
    {
        Gate::authorize('tenant-access', $supportTicket);

        return $user->can('edit_support_tickets');
    }

    public function assign(User $user, SupportTicket $supportTicket): bool
    {
        Gate::authorize('tenant-access', $supportTicket);

        return $user->can('assign_support_tickets');
    }

    public function resolve(User $user, SupportTicket $supportTicket): bool
    {
        Gate::authorize('tenant-access', $supportTicket);

        return $user->can('resolve_support_tickets');
    }
}
