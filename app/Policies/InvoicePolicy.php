<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\Gate;

class InvoicePolicy
{
    use HandlesAuthorization;

    public function view(User $user, Invoice $invoice): bool
    {
        Gate::authorize('tenant-access', $invoice);

        return $user->can('view_invoices');
    }

    public function create(User $user): bool
    {
        return $user->can('create_invoices');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        Gate::authorize('tenant-access', $invoice);

        return $user->can('edit_invoices') && $invoice->status === Invoice::STATUS_DRAFT;
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        Gate::authorize('tenant-access', $invoice);

        return $user->can('delete_invoices') && $invoice->status === Invoice::STATUS_DRAFT;
    }
}
