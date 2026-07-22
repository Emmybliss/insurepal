<?php

namespace App\Services\Claims;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\User;
use App\Services\Concerns\HandlesListing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ClaimListingService
{
    use HandlesListing;

    protected const ALLOWED_SORT_COLUMNS = [
        'claim_reference', 'claim_type', 'claim_amount', 'approved_amount',
        'incident_date', 'status', 'created_at', 'submitted_at',
    ];

    protected const CLAIM_TYPES = [
        ['value' => 'accident', 'label' => 'Accident'],
        ['value' => 'theft', 'label' => 'Theft'],
        ['value' => 'damage', 'label' => 'Damage'],
        ['value' => 'fire', 'label' => 'Fire'],
        ['value' => 'flood', 'label' => 'Flood'],
        ['value' => 'medical', 'label' => 'Medical'],
        ['value' => 'death', 'label' => 'Death'],
        ['value' => 'disability', 'label' => 'Disability'],
        ['value' => 'liability', 'label' => 'Liability'],
        ['value' => 'other', 'label' => 'Other'],
    ];

    protected const DOCUMENT_TYPES = [
        ['value' => 'incident_photo', 'label' => 'Incident Photo'],
        ['value' => 'police_report', 'label' => 'Police Report'],
        ['value' => 'medical_report', 'label' => 'Medical Report'],
        ['value' => 'repair_estimate', 'label' => 'Repair Estimate'],
        ['value' => 'invoice', 'label' => 'Invoice'],
        ['value' => 'receipt', 'label' => 'Receipt'],
        ['value' => 'witness_statement', 'label' => 'Witness Statement'],
        ['value' => 'correspondence', 'label' => 'Correspondence'],
        ['value' => 'other', 'label' => 'Other'],
    ];

    public function list(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Claim::query()
            ->forTenant($user->tenant_id)
            ->with(['customer', 'policy', 'submittedBy', 'reviewer']);

        if ($user->hasRole('customer')) {
            $query->where('customer_id', $user->customer?->id);
        }

        $query = $this->applySearch($query, $filters['search'] ?? null, [
            'claim_reference',
            'incident_description',
            'customer.first_name',
            'customer.last_name',
            'customer.company_name',
        ]);
        $query = $this->applyStatusFilter($query, $filters['status'] ?? null);
        $query = $this->applyClaimTypeFilter($query, $filters['claim_type'] ?? null);
        $query = $this->applyCustomerIdFilter($query, $filters['customer_id'] ?? null);
        $query = $this->applyDateRange($query, $filters['date_from'] ?? null, $filters['date_to'] ?? null, 'incident_date');
        $query = $this->applySort($query, $filters['sort_by'] ?? null, $filters['sort_order'] ?? null, self::ALLOWED_SORT_COLUMNS);

        return $this->applyPagination($query, $perPage);
    }

    public function getStats(User $user): array
    {
        $base = Claim::forTenant($user->tenant_id);

        if ($user->hasRole('customer')) {
            $base->where('customer_id', $user->customer?->id);
        }

        return [
            'total' => (clone $base)->count(),
            'pending' => (clone $base)->pending()->count(),
            'approved' => (clone $base)->approved()->count(),
            'rejected' => (clone $base)->rejected()->count(),
            'settled' => (clone $base)->settled()->count(),
        ];
    }

    public function getCreateData(User $user): array
    {
        if ($user->hasRole('customer')) {
            $customer = Customer::where('user_id', $user->id)->first();

            $policies = $customer
                ? Policy::where('tenant_id', $user->tenant_id)
                    ->where('customer_id', $customer->id)
                    ->where('status', Policy::STATUS_ACTIVE)
                    ->with(['customer', 'policyProduct'])
                    ->get()
                : collect();

            return [
                'policies' => $policies,
                'customers' => $customer ? collect([$customer]) : collect(),
            ];
        }

        return [
            'policies' => Policy::where('tenant_id', $user->tenant_id)
                ->where('status', Policy::STATUS_ACTIVE)
                ->with(['customer', 'policyProduct'])
                ->get(),
            'customers' => Customer::where('tenant_id', $user->tenant_id)
                ->where('is_active', true)
                ->get(),
        ];
    }

    public function getEditData(User $user): array
    {
        return [
            'policies' => Policy::where('tenant_id', $user->tenant_id)
                ->where('status', Policy::STATUS_ACTIVE)
                ->with(['customer', 'policyProduct'])
                ->get(),
            'customers' => Customer::where('tenant_id', $user->tenant_id)
                ->where('is_active', true)
                ->get(),
        ];
    }

    public function getClaimTypes(): array
    {
        return self::CLAIM_TYPES;
    }

    public function getDocumentTypes(): array
    {
        return self::DOCUMENT_TYPES;
    }

    public function getShowPermissions(User $user, Claim $claim): array
    {
        return [
            'canEdit' => $user->can('update', $claim),
            'canSubmit' => $user->can('submit', $claim),
            'canReview' => $user->can('review', $claim),
            'canApprove' => $user->can('approve', $claim),
            'canReject' => $user->can('reject', $claim),
            'canSettle' => $user->can('settle', $claim),
            'canClose' => $user->can('close', $claim),
            'canAddDocuments' => $user->can('addDocuments', $claim),
            'canAddComments' => $user->can('addComments', $claim),
        ];
    }

    protected function applyStatusFilter($query, ?string $status)
    {
        return $status ? $query->where('status', $status) : $query;
    }

    protected function applyClaimTypeFilter($query, ?string $claimType)
    {
        return $claimType ? $query->where('claim_type', $claimType) : $query;
    }

    protected function applyCustomerIdFilter($query, mixed $customerId)
    {
        return $customerId ? $query->forCustomer((int) $customerId) : $query;
    }

    protected function applySort($query, ?string $sortBy, ?string $sortOrder = null, array $allowedColumns = []): Builder
    {
        $column = $sortBy ?? 'created_at';
        $direction = $sortOrder ?? 'desc';

        if (! empty($allowedColumns) && ! in_array($column, $allowedColumns, true)) {
            $column = 'created_at';
            $direction = 'desc';
        }

        return $query->orderBy($column, $direction);
    }
}
