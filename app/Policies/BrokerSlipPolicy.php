<?php

namespace App\Policies;

use App\Models\BrokerSlip;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\Gate;

class BrokerSlipPolicy
{
    use HandlesAuthorization;

    public function view(User $user, BrokerSlip $brokerSlip): bool
    {
        Gate::authorize('tenant-access', $brokerSlip);

        return $user->can('view_broker_slips');
    }

    public function create(User $user): bool
    {
        return $user->can('create_broker_slips');
    }

    public function update(User $user, BrokerSlip $brokerSlip): bool
    {
        Gate::authorize('tenant-access', $brokerSlip);

        return $user->can('edit_broker_slips') && $brokerSlip->isDraft();
    }

    public function delete(User $user, BrokerSlip $brokerSlip): bool
    {
        Gate::authorize('tenant-access', $brokerSlip);

        return $user->can('delete_broker_slips') && $brokerSlip->isDraft();
    }
}
