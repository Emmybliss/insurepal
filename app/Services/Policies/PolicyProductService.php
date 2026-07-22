<?php

namespace App\Services\Policies;

use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class PolicyProductService
{
    public function __construct(
        protected PolicyListingService $listingService,
    ) {}

    public function list(User $user, array $filters = [], int $perPage = 15): array
    {
        $tenantId = $user->tenant_id;

        $query = PolicyProduct::query()
            ->where('tenant_id', $tenantId)
            ->with(['policyType', 'policyClass']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('policyType', fn ($sq) => $sq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('policyClass', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if (isset($filters['status'])) {
            $query->where('is_active', filter_var($filters['status'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['policy_type_id'])) {
            $query->where('policy_type_id', $filters['policy_type_id']);
        }

        if (! empty($filters['policy_class_id'])) {
            $query->where('policy_class_id', $filters['policy_class_id']);
        }

        $query->ordered();

        $policies = $query->paginate($perPage)->withQueryString();

        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'policy_type_id', 'risk_mode']);

        $stats = [
            'total' => PolicyProduct::where('tenant_id', $tenantId)->count(),
            'active' => PolicyProduct::where('tenant_id', $tenantId)->where('is_active', true)->count(),
            'inactive' => PolicyProduct::where('tenant_id', $tenantId)->where('is_active', false)->count(),
            'total_premium' => PolicyProduct::where('tenant_id', $tenantId)->sum('base_premium'),
        ];

        return [
            'policies' => $policies,
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
            'stats' => $stats,
            'filters' => $filters,
        ];
    }

    public function getCreateData(User $user): array
    {
        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name', 'code']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'code', 'policy_type_id', 'risk_mode']);
        $policyProducts = PolicyProduct::active()->with('policyClass')->ordered()->get(['id', 'name', 'code', 'policy_class_id']);

        return [
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
            'policyProduct' => $policyProducts,
        ];
    }

    public function getEditData(PolicyProduct $policy, User $user): array
    {
        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name', 'code']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'code', 'policy_type_id', 'risk_mode']);
        $policy->load(['policyType', 'policyClass']);

        return [
            'policy' => $policy,
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
        ];
    }

    public function store(array $data, User $user): PolicyProduct
    {
        $data['tenant_id'] = $user->tenant_id;

        if (! isset($data['base_premium']) || empty($data['base_premium'])) {
            $policyClass = PolicyClass::with('policyType')->find($data['policy_class_id']);
            if ($policyClass && isset($policyClass->calculated_premium)) {
                $data['base_premium'] = $policyClass->calculated_premium;
            }
            if ($policyClass && isset($policyClass->calculated_commission_rate)) {
                $data['commission_rate'] = $policyClass->calculated_commission_rate;
            }
        }

        return PolicyProduct::create($data);
    }

    public function update(PolicyProduct $policy, array $data): PolicyProduct
    {
        $data['tenant_id'] = $policy->tenant_id;
        $policy->update($data);

        return $policy->fresh();
    }

    public function delete(PolicyProduct $policy): void
    {
        if ($policy->quotes()->exists()) {
            throw new \Exception('Cannot delete policy that has associated quotes.');
        }

        $policy->delete();
    }

    public function toggleActive(PolicyProduct $policy, ?bool $active = null): PolicyProduct
    {
        $policy->update(['is_active' => $active ?? ! $policy->is_active]);

        return $policy->fresh();
    }

    public function getByClass(PolicyClass $policyClass, User $user): Collection
    {
        return $policyClass->policyProducts()
            ->where('tenant_id', $user->tenant_id)
            ->active()
            ->ordered()
            ->get(['id', 'name', 'code', 'base_premium', 'min_sum_assured', 'max_sum_assured']);
    }

    public function calculatePremium(PolicyProduct $policy, float $sumAssured, array $factors = []): array
    {
        $premium = $policy->calculatePremium($sumAssured, $factors);

        return [
            'premium' => $premium,
            'commission' => $premium * ($policy->commission_rate / 100),
        ];
    }
}
