<?php

namespace App\Services\Policies;

use App\Models\Policy;
use App\Models\User;
use App\Services\Concerns\HandlesListing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PolicyListingService
{
    use HandlesListing;

    protected const ALLOWED_SORT_COLUMNS = [
        'policy_number', 'effective_date', 'expiry_date',
        'premium_amount', 'total_amount', 'status', 'created_at',
    ];

    public function list(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $tenantId = $user->tenant_id;

        $query = Policy::forTenant($tenantId)
            ->with(['customer', 'policyProduct', 'policyType', 'policyClass', 'createdBy']);

        $query = $this->applySearch($query, $filters['search'] ?? null, [
            'policy_number',
            'customer.name',
            'policyProduct.name',
        ]);
        $query = $this->applyStatusFilter($query, $filters['status'] ?? null);
        $query = $this->applyApprovalStatusFilter($query, $filters['approval_status'] ?? null);
        $query = $this->applySourceTypeFilter($query, $filters['source_type'] ?? null);
        $query = $this->applyCustomerFilter($query, $filters['customer_id'] ?? null);
        $query = $this->applyProductFilter($query, $filters['policy_product_id'] ?? null);
        $query = $this->applyDateRange($query, $filters['date_from'] ?? null, $filters['date_to'] ?? null);
        $query = $this->applyActiveFilter($query, $filters['active'] ?? null);
        $query = $this->applyExpiringFilter($query, $filters['expiring'] ?? null, $filters['expiring_days'] ?? null);
        $query = $this->applySort($query, $filters['sort'] ?? null, self::ALLOWED_SORT_COLUMNS);

        return $this->applyPagination($query, $perPage);
    }

    public function getStats(User $user): array
    {
        $tenantId = $user->tenant_id;

        return [
            'total' => Policy::where('tenant_id', $tenantId)->count(),
            'active' => Policy::where('tenant_id', $tenantId)->active()->count(),
            'pending' => Policy::where('tenant_id', $tenantId)->pendingApproval()->count(),
            'expired' => Policy::where('tenant_id', $tenantId)->expired()->count(),
        ];
    }

    public function getDirectCreateData(User $user): array
    {
        $customers = \App\Models\Customer::where('tenant_id', $user->tenant_id)
            ->active()
            ->orderBy('id')
            ->get(['id', 'first_name', 'last_name', 'company_name', 'email', 'phone']);

        $policyProducts = \App\Models\PolicyProduct::where('tenant_id', $user->tenant_id)
            ->active()
            ->with(['policyType', 'policyClass'])
            ->orderBy('name')
            ->get();

        return [
            'customers' => $customers,
            'policyProducts' => $policyProducts,
        ];
    }

    protected function applyStatusFilter($query, $status)
    {
        return $status ? $query->where('status', $status) : $query;
    }

    protected function applyApprovalStatusFilter($query, $status)
    {
        return $status ? $query->where('approval_status', $status) : $query;
    }

    protected function applySourceTypeFilter($query, $sourceType)
    {
        return $sourceType ? $query->where('source_type', $sourceType) : $query;
    }

    protected function applyCustomerFilter($query, $customerId)
    {
        return $customerId ? $query->where('customer_id', $customerId) : $query;
    }

    protected function applyProductFilter($query, $productId)
    {
        return $productId ? $query->where('policy_product_id', $productId) : $query;
    }

    protected function applyActiveFilter($query, $active)
    {
        if ($active === null) {
            return $query;
        }

        return filter_var($active, FILTER_VALIDATE_BOOLEAN) ? $query->active() : $query;
    }

    protected function applyExpiringFilter($query, $expiring, $days)
    {
        if ($expiring === null || ! filter_var($expiring, FILTER_VALIDATE_BOOLEAN)) {
            return $query;
        }

        return $query->expiring((int) ($days ?? 30));
    }
}
