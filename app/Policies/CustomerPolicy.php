<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Super admin can view all customers
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Tenant users can view customers within their tenant
        return $user->tenant_id !== null;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Customer $customer): bool
    {
        // Super admin can view any customer
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users can only view customers within their tenant
        return $user->tenant_id === $customer->tenant_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Super admin cannot create customers (they're global)
        if ($user->isSuperAdmin()) {
            return false;
        }

        // Tenant users can create customers
        return $user->tenant_id !== null;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Customer $customer): bool
    {
        // Super admin can update any customer
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users can only update customers within their tenant
        return $user->tenant_id === $customer->tenant_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Customer $customer): bool
    {
        // Super admin can delete any customer
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users can only delete customers within their tenant
        return $user->tenant_id === $customer->tenant_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Customer $customer): bool
    {
        return $this->update($user, $customer);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Customer $customer): bool
    {
        return $this->delete($user, $customer);
    }
}
