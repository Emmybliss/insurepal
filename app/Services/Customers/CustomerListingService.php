<?php

namespace App\Services\Customers;

use App\Models\Customer;
use App\Models\User;
use App\Services\Concerns\HandlesListing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerListingService
{
    use HandlesListing;

    public function list(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Customer::query()
            ->forTenant($user->tenant_id)
            ->with(['user', 'kyc', 'quotes.insuranceProduct', 'policies.policyProduct'])
            ->latest();

        $query = $this->applySearch($query, $filters['search'] ?? null, [
            'first_name',
            'last_name',
            'company_name',
            'email',
        ]);

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $this->applyPagination($query, $perPage);
    }

    public function getCustomerStats(Customer $customer): array
    {
        return [
            'total_quotes' => $customer->quotes->count(),
            'total_policies' => $customer->policies->count(),
            'active_policies' => $customer->policies->filter(fn ($p) => $p->isActive() && ! $p->isExpired())->count(),
            'total_premium' => $customer->policies->filter(fn ($p) => $p->isActive() && ! $p->isExpired())->sum('premium_amount'),
            'total_claims' => $customer->claims->count(),
            'total_invoices' => $customer->invoices->count(),
        ];
    }
}
