<?php

namespace App\Services;

use App\Enums\QuoteStatus;
use App\Models\Policy;
use App\Models\Quote;
use App\Models\QuoteApproval;
use App\Models\QuoteClause;
use App\Models\QuoteEmailLog;
use App\Models\QuoteRisk;
use App\Models\QuoteVersion;
use App\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class QuoteService
{
    public function getQuotesForTenant(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Quote::query()
            ->forTenant($user->tenant_id)
            ->with([
                'customer:id,type,first_name,last_name,company_name,email',
                'insuranceProduct:id,name,type',
                'policyClass:id,name',
                'createdBy:id,name',
            ])
            ->latest();

        $query = $this->applyFilters($query, $filters);

        return $query->paginate($perPage)->withQueryString();
    }

    public function createQuote(array|User $arg1, array|User $arg2): Quote
    {
        $data = is_array($arg1) ? $arg1 : $arg2;
        $user = $arg1 instanceof User ? $arg1 : $arg2;

        return DB::transaction(function () use ($data, $user) {
            $tenantId = $user->tenant_id;

            $grossPremium = $data['gross_premium'] ?? ($data['premium_amount'] ?? 0);
            $commissionRate = $data['commission_rate'] ?? 0;
            $commissionAmount = $data['commission_amount'] ?? round(($grossPremium * $commissionRate) / 100, 2);
            $taxRate = $data['tax_rate'] ?? 0;
            $taxAmount = $data['taxes'] ?? round(($grossPremium * $taxRate) / 100, 2);
            $fees = $data['fees'] ?? 0;
            $discount = $data['discount'] ?? 0;
            $netPremium = $data['net_premium'] ?? ($grossPremium - $commissionAmount + $fees + $taxAmount - $discount);

            $validUntil = $data['valid_until'] ?? now()->addDays(30);
            $periodStart = $data['period_start'] ?? now();
            $periodEnd = $data['period_end'] ?? now()->addYear();

            $quote = Quote::create([
                'tenant_id' => $tenantId,
                'customer_id' => $data['customer_id'],
                'insurance_product_id' => $data['insurance_product_id'] ?? null,
                'policy_class_id' => $data['policy_class_id'] ?? null,
                'policy_type_id' => $data['policy_type_id'] ?? null,
                'placement_id' => $data['placement_id'] ?? null,
                'currency' => $data['currency'] ?? 'NGN',
                'sum_insured' => $data['sum_insured'] ?? 0,
                'rate' => $data['rate'] ?? null,
                'rate_basis' => $data['rate_basis'] ?? 'percentage',
                'gross_premium' => $grossPremium,
                'premium_amount' => $grossPremium,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commissionAmount,
                'tax_rate' => $taxRate,
                'taxes' => $taxAmount,
                'fees' => $fees,
                'discount' => $discount,
                'net_premium' => $netPremium,
                'total_amount' => $netPremium > 0 ? $netPremium : $grossPremium,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'valid_until' => $validUntil,
                'claim_payment_condition' => $data['claim_payment_condition'] ?? ($data['notes'] ?? null),
                'coverage_details' => $data['coverage_details'] ?? null,
                'form_data' => $data['form_data'] ?? null,
                'notes' => $data['notes'] ?? null,
                'internal_notes' => $data['internal_notes'] ?? null,
                'status' => QuoteStatus::Draft->value,
                'created_by' => $user->id,
            ]);

            if (! empty($data['risks'])) {
                $this->syncRisks($quote, $data['risks']);
            } elseif (! empty($data['items'])) {
                $this->syncRisks($quote, $data['items']);
            } elseif (! empty($data['coverage_details'])) {
                // Synthesize legacy single risk if coverage details provided
                $this->syncLegacyCoverageRisk($quote, $data);
            }

            if (! empty($data['clauses'])) {
                $this->syncClauses($quote, $data['clauses']);
            }

            $this->recalculateTotals($quote);

            return $quote->load([
                'customer',
                'insuranceProduct',
                'policyClass',
                'risks',
                'clauses',
                'createdBy',
            ]);
        });
    }

    public function updateQuote(Quote $quote, array $data): Quote
    {
        if ($quote->status === QuoteStatus::Converted->value || $quote->status === QuoteStatus::Superseded->value) {
            throw new Exception('Cannot modify a quote in this status.');
        }

        return DB::transaction(function () use ($quote, $data) {
            $quote->update($data);

            if (isset($data['risks'])) {
                $quote->risks()->delete();
                $this->syncRisks($quote, $data['risks']);
            } elseif (isset($data['items'])) {
                $quote->risks()->delete();
                $this->syncRisks($quote, $data['items']);
            }

            if (isset($data['clauses'])) {
                $quote->clauses()->delete();
                $this->syncClauses($quote, $data['clauses']);
            }

            $this->recalculateTotals($quote);

            return $quote->fresh([
                'customer',
                'insuranceProduct',
                'policyClass',
                'risks',
                'clauses',
                'createdBy',
            ]);
        });
    }

    public function deleteQuote(Quote $quote): bool
    {
        return DB::transaction(function () use ($quote) {
            if ($quote->policy) {
                throw new Exception('Cannot delete quote that has been converted to a policy.');
            }

            if ($quote->status === QuoteStatus::Accepted->value || $quote->status === QuoteStatus::Converted->value) {
                throw new Exception('Cannot delete accepted or converted quote.');
            }

            $quote->delete();

            return true;
        });
    }

    public function submitForReview(Quote $quote, User $user, ?string $notes = null): QuoteApproval
    {
        if ($quote->status !== QuoteStatus::Draft->value &&
            $quote->status !== QuoteStatus::ChangesRequested->value) {
            throw new Exception('Only draft quotes can be submitted for review.');
        }

        return DB::transaction(function () use ($quote, $user, $notes) {
            $quote->update(['status' => QuoteStatus::PendingReview->value]);

            return QuoteApproval::create([
                'tenant_id' => $quote->tenant_id,
                'quote_id' => $quote->id,
                'requested_by' => $user->id,
                'status' => QuoteApproval::STATUS_PENDING,
                'request_notes' => $notes,
            ]);
        });
    }

    public function sendQuote(Quote $quote, ?User $user = null, array $emailData = []): bool
    {
        if (! $quote->canSend()) {
            throw new Exception('Quote cannot be sent in its current status.');
        }

        $sender = $user ?? auth()->user();

        return DB::transaction(function () use ($quote, $sender, $emailData) {
            $quote->markAsSent();

            QuoteEmailLog::create([
                'tenant_id' => $quote->tenant_id,
                'quote_id' => $quote->id,
                'sent_to' => $emailData['sent_to'] ?? ($quote->customer->email ?? 'customer@example.com'),
                'subject' => $emailData['subject'] ?? "Insurance Quote #{$quote->quote_number}",
                'body' => $emailData['body'] ?? null,
                'sent_by' => $sender ? $sender->id : $quote->created_by,
                'sent_at' => now(),
            ]);

            return true;
        });
    }

    public function acceptQuote(Quote $quote, ?string $reason = null): Quote
    {
        if (! $quote->canAccept()) {
            throw new Exception('Quote cannot be accepted in its current status or has expired.');
        }

        $quote->markAsAccepted($reason);

        return $quote;
    }

    public function rejectQuote(Quote $quote, ?string $reason = null): Quote
    {
        if (! $quote->canReject()) {
            throw new Exception('Quote cannot be rejected in its current status.');
        }

        $quote->markAsRejected($reason);

        return $quote;
    }

    public function issueQuote(Quote $quote, User $user): Quote
    {
        return DB::transaction(function () use ($quote, $user) {
            $snapshot = $this->buildSnapshot($quote, $user);
            $checksum = hash('sha256', json_encode($snapshot));

            $quote->update([
                'status' => QuoteStatus::Approved->value,
                'snapshot_json' => $snapshot,
                'checksum' => $checksum,
                'issued_at' => now(),
                'issued_by' => $user->id,
            ]);

            QuoteVersion::create([
                'tenant_id' => $quote->tenant_id,
                'quote_id' => $quote->id,
                'version' => $quote->version,
                'snapshot_json' => $snapshot,
                'pdf_path' => $quote->pdf_path,
                'checksum' => $checksum,
                'created_by' => $user->id,
            ]);

            return $quote->fresh([
                'customer',
                'insuranceProduct',
                'risks',
                'clauses',
                'versions',
            ]);
        });
    }

    public function createNewVersion(Quote $quote): Quote
    {
        return DB::transaction(function () use ($quote) {
            $newVersion = $quote->replicate();
            $newVersion->version = $quote->version + 1;
            $newVersion->status = QuoteStatus::Draft->value;
            $newVersion->issued_at = null;
            $newVersion->issued_by = null;
            $newVersion->approved_by = null;
            $newVersion->reviewed_by = null;
            $newVersion->signed_by = null;
            $newVersion->pdf_path = null;
            $newVersion->checksum = null;
            $newVersion->snapshot_json = null;
            $newVersion->quote_number = null;
            $newVersion->save();

            $quote->update(['status' => QuoteStatus::Superseded->value]);

            return $newVersion->fresh(['customer', 'insuranceProduct']);
        });
    }

    public function withdrawQuote(Quote $quote): Quote
    {
        $quote->update(['status' => QuoteStatus::Withdrawn->value]);

        return $quote->fresh();
    }

    public function convertToPolicy(Quote $quote, User $user): Policy
    {
        if (! $quote->canConvertToPolicy()) {
            throw new Exception('Only accepted quotes can be converted to policies.');
        }

        return DB::transaction(function () use ($quote, $user) {
            $policy = Policy::create([
                'tenant_id' => $quote->tenant_id,
                'customer_id' => $quote->customer_id,
                'quote_id' => $quote->id,
                'insurance_product_id' => $quote->insurance_product_id,
                'policy_number' => $this->generatePolicyNumber(),
                'status' => 'active',
                'effective_date' => $quote->period_start ?? now(),
                'expiry_date' => $quote->period_end ?? now()->addYear(),
                'coverage_details' => $quote->coverage_details ?? [],
                'premium_amount' => $quote->gross_premium,
                'commission_amount' => $quote->commission_amount,
                'total_amount' => $quote->net_premium > 0 ? $quote->net_premium : $quote->total_amount,
                'form_data' => $quote->form_data ?? [],
                'created_by' => $user->id,
            ]);

            $quote->update(['status' => QuoteStatus::Converted->value]);

            return $policy->load(['customer', 'insuranceProduct', 'quote']);
        });
    }

    public function duplicateQuote(Quote $quote): Quote
    {
        $newQuote = $quote->duplicate();

        return $newQuote->load(['customer', 'insuranceProduct', 'createdBy']);
    }

    public function extendQuoteValidity(Quote $quote, int $days = 30): Quote
    {
        $quote->extendValidity($days);

        return $quote;
    }

    public function getQuoteStatistics(int $tenantId): array
    {
        $baseQuery = Quote::forTenant($tenantId);

        return [
            'total' => $baseQuery->count(),
            'draft' => $baseQuery->byStatus(QuoteStatus::Draft)->count(),
            'sent' => $baseQuery->byStatus(QuoteStatus::Sent)->count(),
            'accepted' => $baseQuery->byStatus(QuoteStatus::Accepted)->count(),
            'rejected' => $baseQuery->byStatus(QuoteStatus::Rejected)->count(),
            'expired' => $baseQuery->byStatus(QuoteStatus::Expired)->count(),
            'expiring_soon' => $baseQuery->expiringWithin(7)->count(),
            'total_value' => $baseQuery->sum('net_premium'),
            'average_value' => $baseQuery->avg('net_premium') ?? 0,
            'conversion_rate' => $this->calculateConversionRate($tenantId),
        ];
    }

    public function getExpiringQuotes(User $user, int $days = 7): \Illuminate\Database\Eloquent\Collection
    {
        return Quote::forTenant($user->tenant_id)
            ->expiringWithin($days)
            ->with(['customer', 'insuranceProduct'])
            ->get();
    }

    public function markExpiredQuotes(): int
    {
        $expiredCount = 0;

        $expiredQuotes = Quote::where('valid_until', '<', now())
            ->where('status', QuoteStatus::Sent->value)
            ->get();

        foreach ($expiredQuotes as $quote) {
            $quote->markAsExpired();
            $expiredCount++;
        }

        return $expiredCount;
    }

    private function syncRisks(Quote $quote, array $risks): void
    {
        foreach ($risks as $index => $risk) {
            $policyProductId = $risk['policy_product_id'] ?? null;
            if (! $policyProductId && ! empty($quote->insurance_product_id)) {
                if (DB::table('policy_products')->where('id', $quote->insurance_product_id)->exists()) {
                    $policyProductId = $quote->insurance_product_id;
                }
            }

            QuoteRisk::create([
                'tenant_id' => $quote->tenant_id,
                'quote_id' => $quote->id,
                'policy_class_id' => $risk['policy_class_id'] ?? $quote->policy_class_id,
                'policy_product_id' => $policyProductId,
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

    private function syncLegacyCoverageRisk(Quote $quote, array $data): void
    {
        $sumInsured = 0;
        if (is_array($data['coverage_details'])) {
            foreach ($data['coverage_details'] as $coverage) {
                if (isset($coverage['amount']) && is_numeric($coverage['amount'])) {
                    $sumInsured += (float) $coverage['amount'];
                }
            }
        }

        $policyProductId = null;
        if (! empty($quote->insurance_product_id) && DB::table('policy_products')->where('id', $quote->insurance_product_id)->exists()) {
            $policyProductId = $quote->insurance_product_id;
        }

        QuoteRisk::create([
            'tenant_id' => $quote->tenant_id,
            'quote_id' => $quote->id,
            'policy_product_id' => $policyProductId,
            'description' => 'Primary Coverage Risk',
            'coverage_amount' => $sumInsured > 0 ? $sumInsured : ($quote->sum_insured ?? 0),
            'premium' => $quote->gross_premium,
            'sort_order' => 0,
        ]);
    }

    private function syncClauses(Quote $quote, array $clauses): void
    {
        foreach ($clauses as $index => $clause) {
            QuoteClause::create([
                'tenant_id' => $quote->tenant_id,
                'quote_id' => $quote->id,
                'clause_type' => $clause['clause_type'] ?? 'clause',
                'title' => $clause['title'],
                'content' => $clause['content'],
                'is_standard' => $clause['is_standard'] ?? false,
                'sort_order' => $index,
            ]);
        }
    }

    private function recalculateTotals(Quote $quote): void
    {
        $quote->load('risks');

        if ($quote->risks->isNotEmpty()) {
            $sumInsured = (float) $quote->risks->sum('coverage_amount');
            $grossPremium = (float) $quote->risks->sum('premium');
        } else {
            $sumInsured = (float) $quote->sum_insured;
            $grossPremium = (float) $quote->gross_premium;
        }

        $commissionRate = (float) ($quote->commission_rate ?? 0);
        $commissionAmount = round(($grossPremium * $commissionRate) / 100, 2);

        $taxRate = (float) ($quote->tax_rate ?? 0);
        $taxAmount = round(($grossPremium * $taxRate) / 100, 2);

        $fees = (float) ($quote->fees ?? 0);
        $discount = (float) ($quote->discount ?? 0);

        $netPremium = round(max($grossPremium - $commissionAmount + $taxAmount + $fees - $discount, 0), 2);

        $quote->withoutEvents(fn () => $quote->update([
            'sum_insured' => $sumInsured,
            'gross_premium' => $grossPremium,
            'premium_amount' => $grossPremium,
            'commission_amount' => $commissionAmount,
            'taxes' => $taxAmount,
            'net_premium' => $netPremium,
            'total_amount' => $netPremium > 0 ? $netPremium : $grossPremium,
        ]));
    }

    public function buildSnapshot(Quote $quote, User $user): array
    {
        $quote->loadMissing([
            'customer',
            'insuranceProduct',
            'policyClass',
            'risks',
            'clauses',
            'createdBy',
        ]);

        return [
            'quote' => $quote->toArray(),
            'customer' => $quote->customer?->toArray(),
            'product' => $quote->insuranceProduct?->toArray(),
            'risks' => $quote->risks->toArray(),
            'clauses' => $quote->clauses->toArray(),
            'issued_at' => now()->toIso8601String(),
            'issued_by' => $user->toArray(),
        ];
    }

    public function buildSnapshotForVerification(Quote $quote): array
    {
        $quote->loadMissing([
            'customer',
            'insuranceProduct',
            'policyClass',
            'risks',
            'clauses',
            'createdBy',
        ]);

        $issuer = $quote->issuedBy ?? $quote->createdBy;

        return [
            'quote' => $quote->toArray(),
            'customer' => $quote->customer?->toArray(),
            'product' => $quote->insuranceProduct?->toArray(),
            'risks' => $quote->risks->toArray(),
            'clauses' => $quote->clauses->toArray(),
            'issued_at' => $quote->issued_at?->toIso8601String() ?? now()->toIso8601String(),
            'issued_by' => $issuer?->toArray(),
        ];
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        if (! empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (! empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (! empty($filters['customer_id'])) {
            $query->byCustomer($filters['customer_id']);
        }

        if (! empty($filters['product_id'])) {
            $query->byProduct($filters['product_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['valid_until'])) {
            $query->validUntil($filters['valid_until']);
        }

        if (! empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        return $query;
    }

    private function calculateConversionRate(int $tenantId): float
    {
        $sentQuotes = Quote::forTenant($tenantId)->byStatus(QuoteStatus::Sent)->count();
        $acceptedQuotes = Quote::forTenant($tenantId)->byStatus(QuoteStatus::Accepted)->count();

        if ($sentQuotes === 0) {
            return 0;
        }

        return round(($acceptedQuotes / $sentQuotes) * 100, 2);
    }

    private function generatePolicyNumber(): string
    {
        $prefix = 'POL';
        $year = now()->format('Y');
        $sequence = Policy::whereYear('created_at', $year)->count() + 1;

        return $prefix.$year.str_pad($sequence, 6, '0', STR_PAD_LEFT);
    }
}
