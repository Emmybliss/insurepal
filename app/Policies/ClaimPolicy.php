<?php

namespace App\Policies;

use App\Models\Claim;
use App\Models\User;

class ClaimPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->tenant_id && $user->can('view_claims');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Claim $claim): bool
    {
        // Super admin can view all claims
        if ($user->is_super_admin) {
            return true;
        }

        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have view permission
        if (! $user->can('view_claims')) {
            return false;
        }

        // Customers can only view their own claims
        if ($user->hasRole('customer')) {
            return $claim->customer_id === $user->customer?->id;
        }

        // Brokers and underwriters can view claims in their tenant
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->tenant_id && $user->can('create_claims');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have edit permission
        if (! $user->can('edit_claims')) {
            return false;
        }

        // Can only edit if claim is in editable status
        if (! $claim->canEdit()) {
            return false;
        }

        // Customers can only edit their own claims
        if ($user->hasRole('customer')) {
            return $claim->customer_id === $user->customer?->id;
        }

        return true;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have delete permission
        if (! $user->can('delete_claims')) {
            return false;
        }

        // Can only delete draft claims
        if (! $claim->isDraft()) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can submit the claim.
     */
    public function submit(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must be able to update and claim must be submittable
        return $this->update($user, $claim) && $claim->canSubmit();
    }

    /**
     * Determine whether the user can review the claim.
     */
    public function review(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have review permission
        if (! $user->can('review_claims')) {
            return false;
        }

        // Claim must be reviewable
        return $claim->canReview();
    }

    /**
     * Determine whether the user can approve the claim.
     */
    public function approve(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have approve permission
        if (! $user->can('approve_claims')) {
            return false;
        }

        // Claim must be approvable
        return $claim->canApprove();
    }

    /**
     * Determine whether the user can reject the claim.
     */
    public function reject(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have approve permission (same as approve)
        if (! $user->can('approve_claims')) {
            return false;
        }

        // Claim must be rejectable
        return $claim->canReject();
    }

    /**
     * Determine whether the user can request additional info.
     */
    public function requestInfo(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have review permission
        if (! $user->can('review_claims')) {
            return false;
        }

        return $claim->canRequestInfo();
    }

    /**
     * Determine whether the user can settle the claim.
     */
    public function settle(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have settle permission
        if (! $user->can('settle_claims')) {
            return false;
        }

        return $claim->canSettle();
    }

    /**
     * Determine whether the user can close the claim.
     */
    public function close(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must have settle permission
        if (! $user->can('settle_claims')) {
            return false;
        }

        return $claim->canClose();
    }

    /**
     * Determine whether the user can add documents to the claim.
     */
    public function addDocuments(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must be able to view the claim
        if (! $this->view($user, $claim)) {
            return false;
        }

        return $claim->canAddDocuments();
    }

    /**
     * Determine whether the user can add comments to the claim.
     */
    public function addComments(User $user, Claim $claim): bool
    {
        // Must belong to the same tenant
        if ($user->tenant_id !== $claim->tenant_id) {
            return false;
        }

        // Must be able to view the claim
        return $this->view($user, $claim);
    }

    /**
     * Determine whether the user can view claim analytics.
     */
    public function viewAnalytics(User $user): bool
    {
        return $user->tenant_id && $user->can('view_reports');
    }

    /**
     * Determine whether the user can export claims.
     */
    public function export(User $user): bool
    {
        return $user->tenant_id && $user->can('export_reports');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Claim $claim): bool
    {
        return $user->tenant_id === $claim->tenant_id &&
               $user->can('delete_claims');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Claim $claim): bool
    {
        return $user->is_super_admin ||
               ($user->tenant_id === $claim->tenant_id && $user->can('delete_claims'));
    }
}
