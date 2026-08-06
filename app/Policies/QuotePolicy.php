<?php

namespace App\Policies;

use App\Models\Quote;
use App\Models\User;

class QuotePolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user->tenant_id;
    }

    public function view(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id;
    }

    public function create(User $user): bool
    {
        return (bool) $user->tenant_id;
    }

    public function update(User $user, Quote $quote): bool
    {
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        return $quote->canEdit();
    }

    public function delete(User $user, Quote $quote): bool
    {
        if ($user->tenant_id !== $quote->tenant_id) {
            return false;
        }

        if ($quote->status === Quote::STATUS_ACCEPTED && $quote->policy) {
            return false;
        }

        return in_array($quote->status, [Quote::STATUS_DRAFT, Quote::STATUS_SENT, Quote::STATUS_REJECTED, Quote::STATUS_EXPIRED]);
    }

    public function restore(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id;
    }

    public function forceDelete(User $user, Quote $quote): bool
    {
        return $user->is_super_admin || $user->tenant_id === $quote->tenant_id;
    }

    public function submitForReview(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id;
    }

    public function approve(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id;
    }

    public function send(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id && $quote->canSend();
    }

    public function accept(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id && $quote->canAccept();
    }

    public function reject(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id && $quote->canReject();
    }

    public function convertToPolicy(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id && $quote->canConvertToPolicy();
    }

    public function duplicate(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id;
    }

    public function export(User $user): bool
    {
        return (bool) $user->tenant_id;
    }

    public function viewAnalytics(User $user): bool
    {
        return (bool) $user->tenant_id;
    }

    public function extendValidity(User $user, Quote $quote): bool
    {
        return $user->tenant_id === $quote->tenant_id;
    }
}
