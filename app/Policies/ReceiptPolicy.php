<?php

namespace App\Policies;

use App\Models\Receipt;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\Gate;

class ReceiptPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Receipt $receipt): bool
    {
        Gate::authorize('tenant-access', $receipt);

        return $user->can('view_receipts');
    }

    public function create(User $user): bool
    {
        return $user->can('create_receipts');
    }

    public function update(User $user, Receipt $receipt): bool
    {
        Gate::authorize('tenant-access', $receipt);

        return $user->can('edit_receipts') && $receipt->payment_status === Receipt::STATUS_PENDING;
    }

    public function delete(User $user, Receipt $receipt): bool
    {
        Gate::authorize('tenant-access', $receipt);

        return $user->can('delete_receipts') && $receipt->payment_status === Receipt::STATUS_PENDING;
    }

    public function refund(User $user, Receipt $receipt): bool
    {
        Gate::authorize('tenant-access', $receipt);

        return $user->can('refund_receipts') && $receipt->isCompleted();
    }
}
