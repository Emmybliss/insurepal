<?php

namespace App\Services\Policies;

use App\Models\PolicyApproval;
use App\Models\User;

class PolicyApprovalService
{
    public function list(User $user, array $filters = [], int $perPage = 15): array
    {
        $tenantId = $user->tenant_id;

        $query = PolicyApproval::query()
            ->where('tenant_id', $tenantId)
            ->with(['policy.customer', 'policy.insuranceProduct', 'requestedBy', 'approvedBy']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['approval_type'])) {
            $query->where('approval_type', $filters['approval_type']);
        }

        $query->latest('requested_at');

        $approvals = $query->paginate($perPage)->withQueryString();

        $stats = [
            'pending' => PolicyApproval::where('tenant_id', $tenantId)->pending()->count(),
            'under_review' => PolicyApproval::where('tenant_id', $tenantId)->underReview()->count(),
            'approved' => PolicyApproval::where('tenant_id', $tenantId)->approved()->count(),
            'rejected' => PolicyApproval::where('tenant_id', $tenantId)->rejected()->count(),
        ];

        return [
            'approvals' => $approvals,
            'stats' => $stats,
            'filters' => $filters,
        ];
    }
}
