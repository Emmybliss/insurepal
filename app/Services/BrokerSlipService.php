<?php

namespace App\Services;

use App\Enums\BrokerSlipStatus;
use App\Enums\PlacementMarketStatus;
use App\Enums\PlacementSource;
use App\Enums\PlacementStatus;
use App\Models\BrokerSlip;
use App\Models\BrokerSlipApproval;
use App\Models\BrokerSlipClause;
use App\Models\BrokerSlipItem;
use App\Models\BrokerSlipVersion;
use App\Models\Placement;
use App\Models\PlacementMarket;
use App\Models\Tenant;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BrokerSlipService
{
    public function getSlipsForTenant(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = BrokerSlip::query()
            ->forTenant(Auth::user()->tenant_id)
            ->with([
                'placement:id,placement_number,customer_id',
                'placement.customer:id,type,first_name,last_name,company_name',
                'placementMarket.insuranceCompany:id,name',
                'createdBy:id,name',
            ])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('slip_number', 'like', "%{$filters['search']}%")
                    ->orWhereHas('placement.customer', function ($cq) use ($filters) {
                        $cq->where('first_name', 'like', "%{$filters['search']}%")
                            ->orWhere('last_name', 'like', "%{$filters['search']}%")
                            ->orWhere('company_name', 'like', "%{$filters['search']}%");
                    });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function createSlip(array $data): BrokerSlip
    {
        return DB::transaction(function () use ($data) {
            $tenantId = Auth::user()->tenant_id;
            $tenant = Tenant::find($tenantId);

            $format = $tenant->broker_slip_number_format ?? null;

            $slip = BrokerSlip::create([
                'tenant_id' => $tenantId,
                'placement_id' => $data['placement_id'],
                'placement_market_id' => $data['placement_market_id'] ?? null,
                'currency' => $data['currency'] ?? 'NGN',
                'sum_insured' => $data['sum_insured'] ?? 0,
                'rate' => $data['rate'] ?? null,
                'rate_basis' => $data['rate_basis'] ?? null,
                'gross_premium' => $data['gross_premium'] ?? 0,
                'commission_rate' => $data['commission_rate'] ?? null,
                'commission_amount' => $data['commission_amount'] ?? null,
                'co_broker_commission' => $data['co_broker_commission'] ?? null,
                'reporting_broker_commission' => $data['reporting_broker_commission'] ?? null,
                'fees' => $data['fees'] ?? null,
                'taxes' => $data['taxes'] ?? null,
                'discount' => $data['discount'] ?? null,
                'net_premium' => $data['net_premium'] ?? 0,
                'period_start' => $data['period_start'],
                'period_end' => $data['period_end'],
                'claim_payment_condition' => $data['claim_payment_condition'] ?? null,
                'status' => BrokerSlipStatus::Draft->value,
            ]);

            $slip->slip_number = BrokerSlip::generateSlipNumber($tenantId, $format);
            $slip->saveQuietly();

            if (! empty($data['items'])) {
                $this->syncItems($slip, $data['items']);
            }

            if (! empty($data['clauses'])) {
                $this->syncClauses($slip, $data['clauses']);
            }

            return $slip->load([
                'placement.customer',
                'placementMarket.insuranceCompany',
                'items',
                'clauses',
                'createdBy',
            ]);
        });
    }

    public function createDirectSlip(array $data): BrokerSlip
    {
        return DB::transaction(function () use ($data) {
            $tenantId = Auth::user()->tenant_id;
            $tenant = Tenant::find($tenantId);

            $placement = Placement::create([
                'tenant_id' => $tenantId,
                'customer_id' => $data['customer_id'],
                'insured_id' => $data['insured_id'] ?? null,
                'policy_product_id' => $data['policy_product_id'],
                'currency' => $data['currency'] ?? 'NGN',
                'proposed_start_date' => $data['period_start'],
                'proposed_end_date' => $data['period_end'],
                'total_sum_insured' => $data['sum_insured'] ?? 0,
                'status' => PlacementStatus::Draft->value,
                'placement_source' => PlacementSource::BrokerSlipDirect->value,
                'is_system_generated' => true,
                'risk_details' => isset($data['risk_details']) ? ['description' => $data['risk_details']] : null,
                'notes' => $data['notes'] ?? null,
            ]);

            $market = PlacementMarket::create([
                'tenant_id' => $tenantId,
                'placement_id' => $placement->id,
                'insurance_company_id' => $data['insurance_company_id'],
                'status' => PlacementMarketStatus::Pending->value,
            ]);

            $format = $tenant->broker_slip_number_format ?? null;

            $slip = BrokerSlip::create([
                'tenant_id' => $tenantId,
                'placement_id' => $placement->id,
                'placement_market_id' => $market->id,
                'currency' => $data['currency'] ?? 'NGN',
                'sum_insured' => $data['sum_insured'] ?? 0,
                'rate' => $data['rate'] ?? null,
                'rate_basis' => $data['rate_basis'] ?? null,
                'gross_premium' => $data['gross_premium'] ?? 0,
                'commission_rate' => $data['commission_rate'] ?? null,
                'commission_amount' => $data['commission_amount'] ?? null,
                'co_broker_commission' => $data['co_broker_commission'] ?? null,
                'reporting_broker_commission' => $data['reporting_broker_commission'] ?? null,
                'fees' => $data['fees'] ?? null,
                'taxes' => $data['taxes'] ?? null,
                'discount' => $data['discount'] ?? null,
                'net_premium' => $data['net_premium'] ?? 0,
                'period_start' => $data['period_start'],
                'period_end' => $data['period_end'],
                'claim_payment_condition' => $data['claim_payment_condition'] ?? null,
                'status' => BrokerSlipStatus::Draft->value,
            ]);

            $slip->slip_number = BrokerSlip::generateSlipNumber($tenantId, $format);
            $slip->saveQuietly();

            if (! empty($data['items'])) {
                $this->syncItems($slip, $data['items']);
            }

            if (! empty($data['clauses'])) {
                $this->syncClauses($slip, $data['clauses']);
            }

            return $slip->load([
                'placement.customer',
                'placement.policyProduct.policyClass',
                'placementMarket.insuranceCompany',
                'items',
                'clauses',
                'createdBy',
            ]);
        });
    }

    public function updateSlip(BrokerSlip $slip, array $data): BrokerSlip
    {
        if ($slip->isIssued()) {
            throw new Exception('Cannot modify an issued slip. Create a new version instead.');
        }

        return DB::transaction(function () use ($slip, $data) {
            $slip->update($data);

            if (isset($data['items'])) {
                $slip->items()->delete();
                $this->syncItems($slip, $data['items']);
            }

            if (isset($data['clauses'])) {
                $slip->clauses()->delete();
                $this->syncClauses($slip, $data['clauses']);
            }

            return $slip->fresh([
                'placement.customer',
                'placementMarket.insuranceCompany',
                'items',
                'clauses',
                'createdBy',
            ]);
        });
    }

    public function submitForReview(BrokerSlip $slip, ?string $notes = null): BrokerSlipApproval
    {
        if ($slip->status !== BrokerSlipStatus::Draft->value &&
            $slip->status !== BrokerSlipStatus::ChangesRequested->value) {
            throw new Exception('Only draft slips can be submitted for review.');
        }

        return DB::transaction(function () use ($slip, $notes) {
            $slip->update(['status' => BrokerSlipStatus::PendingReview->value]);

            return BrokerSlipApproval::create([
                'tenant_id' => $slip->tenant_id,
                'broker_slip_id' => $slip->id,
                'requested_by' => Auth::id(),
                'status' => BrokerSlipApproval::STATUS_PENDING,
                'request_notes' => $notes,
            ]);
        });
    }

    public function issueSlip(BrokerSlip $slip): BrokerSlip
    {
        if ($slip->status !== BrokerSlipStatus::Approved->value) {
            throw new Exception('Only approved slips can be issued.');
        }

        return DB::transaction(function () use ($slip) {
            $snapshot = $this->buildSnapshot($slip);
            $checksum = hash('sha256', json_encode($snapshot));

            $slip->update([
                'status' => BrokerSlipStatus::Issued->value,
                'snapshot_json' => $snapshot,
                'checksum' => $checksum,
                'issued_at' => now(),
                'issued_by' => Auth::id(),
            ]);

            BrokerSlipVersion::create([
                'tenant_id' => $slip->tenant_id,
                'broker_slip_id' => $slip->id,
                'version' => $slip->version,
                'snapshot_json' => $snapshot,
                'pdf_path' => $slip->pdf_path,
                'checksum' => $checksum,
                'created_by' => Auth::id(),
            ]);

            return $slip->fresh([
                'placement.customer',
                'placementMarket.insuranceCompany',
                'items',
                'clauses',
                'versions',
            ]);
        });
    }

    public function createNewVersion(BrokerSlip $slip): BrokerSlip
    {
        if (! $slip->isIssued()) {
            throw new Exception('Only issued slips can be revised.');
        }

        return DB::transaction(function () use ($slip) {
            $newVersion = $slip->replicate();
            $newVersion->version = $slip->version + 1;
            $newVersion->status = BrokerSlipStatus::Draft->value;
            $newVersion->issued_at = null;
            $newVersion->issued_by = null;
            $newVersion->approved_by = null;
            $newVersion->reviewed_by = null;
            $newVersion->signed_by = null;
            $newVersion->pdf_path = null;
            $newVersion->checksum = null;
            $newVersion->snapshot_json = null;
            $newVersion->save();

            $slip->update(['status' => BrokerSlipStatus::Superseded->value]);

            return $newVersion->fresh([
                'placement.customer',
                'placementMarket.insuranceCompany',
            ]);
        });
    }

    public function withdrawSlip(BrokerSlip $slip): BrokerSlip
    {
        if ($slip->status !== BrokerSlipStatus::Issued->value &&
            $slip->status !== BrokerSlipStatus::Approved->value) {
            throw new Exception('Only issued or approved slips can be withdrawn.');
        }

        $slip->update(['status' => BrokerSlipStatus::Withdrawn->value]);

        return $slip->fresh();
    }

    private function syncItems(BrokerSlip $slip, array $items): void
    {
        foreach ($items as $index => $item) {
            BrokerSlipItem::create([
                'tenant_id' => $slip->tenant_id,
                'broker_slip_id' => $slip->id,
                'item_type' => $item['item_type'] ?? 'general',
                'description' => $item['description'] ?? null,
                'identifier' => $item['identifier'] ?? null,
                'location' => $item['location'] ?? null,
                'quantity' => $item['quantity'] ?? null,
                'sum_insured' => $item['sum_insured'] ?? 0,
                'rate' => $item['rate'] ?? null,
                'rate_basis' => $item['rate_basis'] ?? null,
                'premium' => $item['premium'] ?? null,
                'metadata' => $item['metadata'] ?? null,
                'sort_order' => $index,
            ]);
        }
    }

    private function syncClauses(BrokerSlip $slip, array $clauses): void
    {
        foreach ($clauses as $index => $clause) {
            BrokerSlipClause::create([
                'tenant_id' => $slip->tenant_id,
                'broker_slip_id' => $slip->id,
                'clause_type' => $clause['clause_type'],
                'title' => $clause['title'],
                'content' => $clause['content'],
                'is_standard' => $clause['is_standard'] ?? false,
                'sort_order' => $index,
            ]);
        }
    }

    private function buildSnapshot(BrokerSlip $slip): array
    {
        $slip->loadMissing([
            'placement.customer',
            'placementMarket.insuranceCompany',
            'items',
            'clauses',
            'createdBy',
        ]);

        return [
            'broker_slip' => $slip->toArray(),
            'customer' => $slip->placement->customer?->toArray(),
            'insurer' => $slip->placementMarket?->insuranceCompany?->toArray(),
            'items' => $slip->items->toArray(),
            'clauses' => $slip->clauses->toArray(),
            'issued_at' => now()->toIso8601String(),
            'issued_by' => Auth::user()?->toArray(),
        ];
    }
}
