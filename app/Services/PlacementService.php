<?php

namespace App\Services;

use App\Enums\PlacementMarketStatus;
use App\Enums\PlacementStatus;
use App\Models\Placement;
use App\Models\Policy;
use App\Models\PolicyProduct;
use App\Models\Quote;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PlacementService
{
    public function getPlacementsForTenant(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Placement::query()
            ->forTenant(Auth::user()->tenant_id)
            ->with([
                'customer:id,type,first_name,last_name,company_name,email',
                'policyProduct:id,name,code',
                'createdBy:id,name',
                'markets:id,placement_id,insurance_company_id,status',
                'markets.insuranceCompany:id,name',
            ])
            ->latest();

        $query = $this->applyFilters($query, $filters);

        return $query->paginate($perPage)->withQueryString();
    }

    public function createFromQuote(Quote $quote, array $extra = []): Placement
    {
        return DB::transaction(function () use ($quote, $extra) {
            $placement = Placement::create([
                'tenant_id' => $quote->tenant_id,
                'quote_id' => $quote->id,
                'customer_id' => $quote->customer_id,
                'policy_product_id' => $extra['policy_product_id'] ?? null,
                'currency' => 'NGN',
                'proposed_start_date' => $extra['proposed_start_date'] ?? now(),
                'proposed_end_date' => $extra['proposed_end_date'] ?? now()->addYear(),
                'total_sum_insured' => $quote->premium_amount,
                'status' => PlacementStatus::Draft->value,
                'notes' => $extra['notes'] ?? null,
                'risk_details' => $quote->form_data,
                'created_by' => Auth::id(),
            ]);

            return $placement->load(['customer', 'policyProduct', 'createdBy']);
        });
    }

    public function createPlacement(array $data): Placement
    {
        return DB::transaction(function () use ($data) {
            $product = PolicyProduct::findOrFail($data['policy_product_id']);

            $placement = Placement::create([
                'customer_id' => $data['customer_id'],
                'insured_id' => $data['insured_id'] ?? null,
                'policy_product_id' => $product->id,
                'currency' => $data['currency'] ?? 'NGN',
                'proposed_start_date' => $data['proposed_start_date'],
                'proposed_end_date' => $data['proposed_end_date'],
                'total_sum_insured' => $data['total_sum_insured'] ?? 0,
                'status' => PlacementStatus::Draft->value,
                'notes' => $data['notes'] ?? null,
                'risk_details' => $data['risk_details'] ?? null,
            ]);

            if (isset($data['quote_id'])) {
                $placement->quote_id = $data['quote_id'];
                $placement->save();
            }

            if (! empty($data['markets'])) {
                foreach ($data['markets'] as $market) {
                    $placement->markets()->create([
                        'insurance_company_id' => $market['insurance_company_id'],
                        'participation_percentage' => $market['participation_percentage'] ?? null,
                        'status' => $market['status'] ?? PlacementMarketStatus::Pending->value,
                        'response_notes' => $market['response_notes'] ?? null,
                    ]);
                }
            }

            return $placement->load(['customer', 'policyProduct', 'createdBy', 'markets.insuranceCompany']);
        });
    }

    public function updatePlacement(Placement $placement, array $data): Placement
    {
        return DB::transaction(function () use ($placement, $data) {
            $placement->update($data);

            if (isset($data['markets'])) {
                $placement->markets()->delete();

                foreach ($data['markets'] as $market) {
                    $placement->markets()->create([
                        'insurance_company_id' => $market['insurance_company_id'],
                        'participation_percentage' => $market['participation_percentage'] ?? null,
                        'status' => $market['status'] ?? PlacementMarketStatus::Pending->value,
                        'response_notes' => $market['response_notes'] ?? null,
                    ]);
                }
            }

            return $placement->fresh(['customer', 'policyProduct', 'markets.insuranceCompany', 'createdBy']);
        });
    }

    public function deletePlacement(Placement $placement): bool
    {
        return DB::transaction(function () use ($placement) {
            if ($placement->policy) {
                throw new Exception('Cannot delete placement that has been converted to a policy.');
            }

            return $placement->delete();
        });
    }

    public function submitToMarket(Placement $placement): Placement
    {
        if ($placement->status !== PlacementStatus::Draft->value) {
            throw new Exception('Only draft placements can be submitted to market.');
        }

        if ($placement->markets->isEmpty()) {
            throw new Exception('Add at least one insurer before submitting to market.');
        }

        return DB::transaction(function () use ($placement) {
            $placement->update(['status' => PlacementStatus::InMarket->value]);

            $placement->markets()->update(['sent_at' => now()]);

            return $placement->fresh(['markets', 'customer', 'policyProduct']);
        });
    }

    public function convertToPolicy(Placement $placement): Policy
    {
        if ($placement->status !== PlacementStatus::Accepted->value &&
            $placement->status !== PlacementStatus::Bound->value) {
            throw new Exception('Only accepted or bound placements can be converted to policies.');
        }

        if ($placement->policy) {
            throw new Exception('This placement has already been converted to a policy.');
        }

        return DB::transaction(function () use ($placement) {
            $acceptedMarket = $placement->markets()
                ->whereIn('status', ['accepted'])
                ->first();

            $policy = Policy::create([
                'tenant_id' => $placement->tenant_id,
                'customer_id' => $placement->customer_id,
                'quote_id' => $placement->quote_id,
                'placement_id' => $placement->id,
                'policy_product_id' => $placement->policy_product_id,
                'policy_number' => Policy::generatePolicyNumber($placement->tenant_id),
                'source_type' => Policy::SOURCE_BROKER_RECORDED,
                'status' => 'active',
                'effective_date' => $placement->proposed_start_date,
                'expiry_date' => $placement->proposed_end_date,
                'premium_amount' => $placement->total_sum_insured,
                'total_amount' => $placement->total_sum_insured,
                'form_data' => $placement->risk_details,
                'created_by' => Auth::id(),
                'insurer_id' => $acceptedMarket?->insurance_company_id,
            ]);

            $placement->update(['status' => PlacementStatus::Bound->value]);

            return $policy->load(['customer', 'policyProduct', 'placement']);
        });
    }

    private function applyFilters($query, array $filters)
    {
        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('placement_number', 'like', "%{$filters['search']}%")
                    ->orWhereHas('customer', function ($cq) use ($filters) {
                        $cq->where('first_name', 'like', "%{$filters['search']}%")
                            ->orWhere('last_name', 'like', "%{$filters['search']}%")
                            ->orWhere('company_name', 'like', "%{$filters['search']}%");
                    });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query;
    }
}
