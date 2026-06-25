<?php

namespace App\Policies;

use App\Models\Quote;
use App\Models\User;

class QuotePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->tenant_id && $user->can('view_quotes');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id && $user->can('view_quotes');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->tenant_id && $user->can('create_quotes');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Quote $quote): bool
    {
        // Must belong to the same tenant and have edit permission
        if ($user->tenant_id !== $quote->tenant_id || ! $user->can('edit_quotes')) {
            return false;
        }

        // Users can update quotes they created or if they have broader permissions
        return $quote->created_by === $user->id || $user->can('edit_quotes');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Quote $quote): bool
    {
        // Must belong to the same tenant and have delete permission
        if ($user->tenant_id !== $quote->tenant_id || ! $user->can('delete_quotes')) {
            return false;
        }

        // Cannot delete accepted quotes that have policies
        if ($quote->status === Quote::STATUS_ACCEPTED && $quote->policy) {
            return false;
        }

        // Users with delete permission can delete quotes in appropriate statuses
        if ($user->can('delete_quotes')) {
            return in_array($quote->status, [Quote::STATUS_DRAFT, Quote::STATUS_SENT, Quote::STATUS_REJECTED, Quote::STATUS_EXPIRED]);
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id &&
               $user->can('edit_quotes');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Quote $quote): bool
    {
        // Only super admin or users with delete permission can permanently delete quotes
        return $user->is_super_admin ||
               ($user->tenant_id === $quote->tenant_id && $user->can('delete_quotes'));
    }

    /**
     * Determine whether the user can send the quote.
     */
    public function send(User $user, Quote $quote): bool
    {
        return $this->update($user, $quote) && $quote->canSend();
    }

    /**
     * Determine whether the user can accept the quote.
     */
    public function accept(User $user, Quote $quote): bool
    {
        // Must belong to the same tenant and have approval permission
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Users with approve permission can accept quotes
        return $user->can('approve_quotes') && $quote->canAccept();
    }

    /**
     * Determine whether the user can reject the quote.
     */
    public function reject(User $user, Quote $quote): bool
    {
        // Must belong to the same tenant and have approval permission
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Users with approve permission can reject quotes
        return $user->can('approve_quotes') && $quote->canReject();
    }

    /**
     * Determine whether the user can convert quote to policy.
     */
    public function convertToPolicy(User $user, Quote $quote): bool
    {
        // Must belong to the same tenant and have create policies permission
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        // Users with create policies permission can convert quotes to policies
        return $user->can('create_policies') && $quote->canConvertToPolicy();
    }

    /**
     * Determine whether the user can duplicate the quote.
     */
    public function duplicate(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id &&
               $user->can('create_quotes');
    }

    /**
     * Determine whether the user can export quotes.
     */
    public function export(User $user): bool
    {
        return $user->tenant_id && $user->can('export_reports');
    }

    /**
     * Determine whether the user can view quote analytics/statistics.
     */
    public function viewAnalytics(User $user): bool
    {
        return $user->tenant_id && $user->can('view_reports');
    }

    /**
     * Determine whether the user can extend quote validity.
     */
    public function extendValidity(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id &&
               $user->can('edit_quotes') &&
               in_array($quote->status, [Quote::STATUS_SENT, Quote::STATUS_EXPIRED]);
    }
}
