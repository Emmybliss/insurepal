<?php

namespace App\Services;

use App\Enums\BrokerSlipStatus;
use App\Enums\PlacementMarketStatus;
use App\Enums\PlacementSource;
use App\Enums\PlacementStatus;
use App\Models\BrokerSlip;
use App\Models\BrokerSlipApproval;
use App\Models\BrokerSlipClause;
use App\Models\BrokerSlipRisk;
use App\Models\BrokerSlipVersion;
use App\Models\Placement;
use App\Models\PlacementMarket;
use App\Models\Tenant;
use App\Models\User;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BrokerSlipService
{
    public function getSlipsForTenant(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = BrokerSlip::query()
            ->forTenant($user->tenant_id)
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

    public function createSlip(User $user, array $data): BrokerSlip
    {
        return DB::transaction(function () use ($user, $data) {
            $tenantId = $user->tenant_id;

            $slip = BrokerSlip::create([
                'tenant_id' => $tenantId,
                'placement_id' => $data['placement_id'],
                'placement_market_id' => $data['placement_market_id'] ?? null,
                'currency' => $data['currency'] ?? 'NGN',
                'period_start' => $data['period_start'],
                'period_end' => $data['period_end'],
                'claim_payment_condition' => $data['claim_payment_condition'] ?? null,
                'commission_rate' => $data['commission_rate'] ?? 0,
                'fees' => $data['fees'] ?? 0,
                'tax_rate' => $data['tax_rate'] ?? 0,
                'status' => BrokerSlipStatus::Draft->value,
            ]);

            if (! empty($data['risks'])) {
                $this->syncRisks($slip, $data['risks']);
            } elseif (! empty($data['items'])) {
                $this->syncRisks($slip, $data['items']);
            }

            if (! empty($data['clauses'])) {
                $this->syncClauses($slip, $data['clauses']);
            }

            $this->recalculateTotals($slip);

            return $slip->load([
                'placement.customer',
                'placementMarket.insuranceCompany',
                'risks',
                'clauses',
                'createdBy',
            ]);
        });
    }

    public function createDirectSlip(User $user, array $data): BrokerSlip
    {
        return DB::transaction(function () use ($user, $data) {
            $tenantId = $user->tenant_id;
            $tenant = Tenant::find($tenantId);

            $placement = Placement::create([
                'tenant_id' => $tenantId,
                'customer_id' => $data['customer_id'],
                'insured_id' => $data['insured_id'] ?? null,
                'policy_product_id' => $data['policy_product_id'],
                'policy_class_id' => $data['policy_class_id'] ?? null,
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
                'period_start' => $data['period_start'],
                'period_end' => $data['period_end'],
                'claim_payment_condition' => $data['claim_payment_condition'] ?? null,
                'commission_rate' => $data['commission_rate'] ?? 0,
                'fees' => $data['fees'] ?? 0,
                'tax_rate' => $data['tax_rate'] ?? 0,
                'status' => BrokerSlipStatus::Draft->value,
            ]);

            if (! empty($data['risks'])) {
                $this->syncRisks($slip, $data['risks']);
            } elseif (! empty($data['items'])) {
                $this->syncRisks($slip, $data['items']);
            }

            if (! empty($data['clauses'])) {
                $this->syncClauses($slip, $data['clauses']);
            }

            $this->recalculateTotals($slip);

            return $slip->load([
                'placement.customer',
                'placement.policyProduct.policyClass',
                'placementMarket.insuranceCompany',
                'risks',
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

            $placement = $slip->placement;
            if ($placement && $placement->is_system_generated) {
                $placementData = [];
                if (isset($data['customer_id'])) {
                    $placementData['customer_id'] = $data['customer_id'];
                }
                if (isset($data['policy_class_id'])) {
                    $placementData['policy_class_id'] = $data['policy_class_id'];
                }
                if (! empty($data['risks'])) {
                    $firstRisk = reset($data['risks']);
                    if (! empty($firstRisk['policy_product_id'])) {
                        $placementData['policy_product_id'] = $firstRisk['policy_product_id'];
                    }
                }
                if (isset($data['period_start'])) {
                    $placementData['proposed_start_date'] = $data['period_start'];
                }
                if (isset($data['period_end'])) {
                    $placementData['proposed_end_date'] = $data['period_end'];
                }
                if (! empty($placementData)) {
                    $placement->update($placementData);
                }

                if (isset($data['insurance_company_id']) && $slip->placementMarket) {
                    $slip->placementMarket->update([
                        'insurance_company_id' => $data['insurance_company_id'],
                    ]);
                }
            }

            if (isset($data['risks'])) {
                $slip->risks()->delete();
                $this->syncRisks($slip, $data['risks']);
            } elseif (isset($data['items'])) {
                $slip->risks()->delete();
                $this->syncRisks($slip, $data['items']);
            }

            if (isset($data['clauses'])) {
                $slip->clauses()->delete();
                $this->syncClauses($slip, $data['clauses']);
            }

            $this->recalculateTotals($slip);

            return $slip->fresh([
                'placement.customer',
                'placementMarket.insuranceCompany',
                'risks',
                'clauses',
                'createdBy',
            ]);
        });
    }

    public function submitForReview(BrokerSlip $slip, User $user, ?string $notes = null): BrokerSlipApproval
    {
        if ($slip->status !== BrokerSlipStatus::Draft->value &&
            $slip->status !== BrokerSlipStatus::ChangesRequested->value) {
            throw new Exception('Only draft slips can be submitted for review.');
        }

        return DB::transaction(function () use ($slip, $user, $notes) {
            $slip->update(['status' => BrokerSlipStatus::PendingReview->value]);

            return BrokerSlipApproval::create([
                'tenant_id' => $slip->tenant_id,
                'broker_slip_id' => $slip->id,
                'requested_by' => $user->id,
                'status' => BrokerSlipApproval::STATUS_PENDING,
                'request_notes' => $notes,
            ]);
        });
    }

    public function issueSlip(BrokerSlip $slip, User $user): BrokerSlip
    {
        if ($slip->status !== BrokerSlipStatus::Approved->value) {
            throw new Exception('Only approved slips can be issued.');
        }

        return DB::transaction(function () use ($slip, $user) {
            $snapshot = $this->buildSnapshot($slip, $user);
            $checksum = hash('sha256', json_encode($snapshot));

            $slip->update([
                'status' => BrokerSlipStatus::Issued->value,
                'snapshot_json' => $snapshot,
                'checksum' => $checksum,
                'issued_at' => now(),
                'issued_by' => $user->id,
            ]);

            BrokerSlipVersion::create([
                'tenant_id' => $slip->tenant_id,
                'broker_slip_id' => $slip->id,
                'version' => $slip->version,
                'snapshot_json' => $snapshot,
                'pdf_path' => $slip->pdf_path,
                'checksum' => $checksum,
                'created_by' => $user->id,
            ]);

            return $slip->fresh([
                'placement.customer',
                'placementMarket.insuranceCompany',
                'risks',
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
            $newVersion->slip_number = null;
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

    private function syncRisks(BrokerSlip $slip, array $risks): void
    {
        foreach ($risks as $index => $risk) {
            BrokerSlipRisk::create([
                'tenant_id' => $slip->tenant_id,
                'broker_slip_id' => $slip->id,
                'policy_class_id' => $risk['policy_class_id'] ?? null,
                'policy_product_id' => $risk['policy_product_id'] ?? null,
                'description' => $risk['description'] ?? null,
                'identifier' => $risk['identifier'] ?? null,
                'location' => $risk['location'] ?? null,
                'quantity' => $risk['quantity'] ?? null,
                'coverage_amount' => $risk['coverage_amount'] ?? ($risk['sum_insured'] ?? 0),
                'rate' => $risk['rate'] ?? null,
                'rate_basis' => $risk['rate_basis'] ?? null,
                'premium' => $risk['premium'] ?? null,
                'net_premium' => 0,
                'commission_rate' => null,
                'commission_amount' => null,
                'taxes' => null,
                'fees' => null,
                'dynamic_fields' => $risk['dynamic_fields'] ?? ($risk['risk_data'] ?? null),
                'metadata' => $risk['metadata'] ?? null,
                'inception_date' => $risk['inception_date'] ?? null,
                'expiry_date' => $risk['expiry_date'] ?? null,
                'sort_order' => $index,
            ]);
        }
    }

    private function recalculateTotals(BrokerSlip $slip): void
    {
        $slip->load('risks');

        $sumInsured = (float) $slip->risks->sum('coverage_amount');
        $grossPremium = (float) $slip->risks->sum('premium');
        $commissionRate = (float) ($slip->commission_rate ?? 0);
        $commissionAmount = round(($grossPremium * $commissionRate) / 100, 2);

        $taxRate = (float) ($slip->tax_rate ?? 0);
        $taxAmount = round(($grossPremium * $taxRate) / 100, 2);

        $additionalFee = (float) ($slip->fees ?? 0);

        $netPremium = $grossPremium - $commissionAmount - $taxAmount - $additionalFee;

        $slip->withoutEvents(fn () => $slip->update([
            'sum_insured' => $sumInsured,
            'gross_premium' => $grossPremium,
            'commission_amount' => $commissionAmount,
            'taxes' => $taxAmount,
            'net_premium' => $netPremium,
        ]));
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

    private function buildSnapshot(BrokerSlip $slip, User $user): array
    {
        $slip->loadMissing([
            'placement.customer',
            'placementMarket.insuranceCompany',
            'risks',
            'clauses',
            'createdBy',
        ]);

        return [
            'broker_slip' => $slip->toArray(),
            'customer' => $slip->placement->customer?->toArray(),
            'insurer' => $slip->placementMarket?->insuranceCompany?->toArray(),
            'risks' => $slip->risks->toArray(),
            'clauses' => $slip->clauses->toArray(),
            'issued_at' => now()->toIso8601String(),
            'issued_by' => $user->toArray(),
        ];
    }
}
