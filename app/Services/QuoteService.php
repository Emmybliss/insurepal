<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Policy;
use App\Models\Quote;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class QuoteService
{
    /**
     * Get paginated quotes with filters for a tenant.
     */
    public function getQuotesForTenant(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Quote::query()
            ->forTenant(Auth::user()->tenant_id)
            ->with([
                'customer:id,type,first_name,last_name,company_name,email',
                'insuranceProduct:id,name,type',
                'createdBy:id,name',
            ])
            ->latest();

        // Apply filters
        $query = $this->applyFilters($query, $filters);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Create a new quote.
     */
    public function createQuote(array $data): Quote
    {
        return DB::transaction(function () use ($data) {
            // Get insurance product for premium calculation
            $product = InsuranceProduct::findOrFail($data['insurance_product_id']);

            // Calculate premium based on form data and coverage
            $premiumAmount = $this->calculatePremium($product, $data['coverage_details'], $data['form_data'] ?? []);
            $commissionAmount = $this->calculateCommission($premiumAmount);

            $quote = Quote::create([
                'tenant_id' => Auth::user()->tenant_id,
                'customer_id' => $data['customer_id'],
                'insurance_product_id' => $data['insurance_product_id'],
                'status' => Quote::STATUS_DRAFT,
                'coverage_details' => $data['coverage_details'],
                'premium_amount' => $premiumAmount,
                'commission_amount' => $commissionAmount,
                'total_amount' => $premiumAmount + $commissionAmount,
                'valid_until' => $data['valid_until'],
                'form_data' => $data['form_data'] ?? [],
                'notes' => $data['notes'] ?? null,
                'internal_notes' => $data['internal_notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Log activity
            $this->logQuoteActivity($quote, 'created', 'Quote created');

            return $quote->load(['customer', 'insuranceProduct', 'createdBy']);
        });
    }

    /**
     * Update an existing quote.
     */
    public function updateQuote(Quote $quote, array $data): Quote
    {
        return DB::transaction(function () use ($quote, $data) {
            // Check if we need to recalculate premium
            $shouldRecalculate = isset($data['coverage_details']) ||
                                isset($data['form_data']) ||
                                isset($data['insurance_product_id']);

            if ($shouldRecalculate) {
                $productId = $data['insurance_product_id'] ?? $quote->insurance_product_id;
                $product = InsuranceProduct::findOrFail($productId);

                $coverageDetails = $data['coverage_details'] ?? $quote->coverage_details;
                $formData = $data['form_data'] ?? $quote->form_data;

                $premiumAmount = $this->calculatePremium($product, $coverageDetails, $formData);
                $commissionAmount = $this->calculateCommission($premiumAmount);

                $data['premium_amount'] = $premiumAmount;
                $data['commission_amount'] = $commissionAmount;
                $data['total_amount'] = $premiumAmount + $commissionAmount;
            }

            $quote->update($data);

            // Log activity
            $this->logQuoteActivity($quote, 'updated', 'Quote updated');

            return $quote->load(['customer', 'insuranceProduct', 'createdBy']);
        });
    }

    /**
     * Delete a quote (soft delete).
     */
    public function deleteQuote(Quote $quote): bool
    {
        return DB::transaction(function () use ($quote) {
            // Check if quote can be deleted
            if ($quote->policy) {
                throw new Exception('Cannot delete quote that has been converted to a policy.');
            }

            if ($quote->status === Quote::STATUS_ACCEPTED) {
                throw new Exception('Cannot delete accepted quote.');
            }

            $quote->delete();

            // Log activity
            $this->logQuoteActivity($quote, 'deleted', 'Quote deleted');

            return true;
        });
    }

    /**
     * Send quote to customer.
     */
    public function sendQuote(Quote $quote): bool
    {
        if (! $quote->canSend()) {
            throw new Exception('Quote cannot be sent in its current status.');
        }

        return DB::transaction(function () use ($quote) {
            $quote->markAsSent();

            // Send email to customer (you would implement the mail class)
            // Mail::to($quote->customer->email)->send(new QuoteSent($quote));

            // Log activity
            $this->logQuoteActivity($quote, 'sent', 'Quote sent to customer via email');

            return true;
        });
    }

    /**
     * Accept a quote.
     */
    public function acceptQuote(Quote $quote, ?string $reason = null): Quote
    {
        if (! $quote->canAccept()) {
            throw new Exception('Quote cannot be accepted in its current status or has expired.');
        }

        $quote->markAsAccepted($reason);

        return $quote;
    }

    /**
     * Reject a quote.
     */
    public function rejectQuote(Quote $quote, ?string $reason = null): Quote
    {
        if (! $quote->canReject()) {
            throw new Exception('Quote cannot be rejected in its current status.');
        }

        $quote->markAsRejected($reason);

        return $quote;
    }

    /**
     * Convert quote to policy.
     */
    public function convertToPolicy(Quote $quote): Policy
    {
        if (! $quote->canConvertToPolicy()) {
            throw new Exception('Only accepted quotes can be converted to policies.');
        }

        return DB::transaction(function () use ($quote) {
            $policy = Policy::create([
                'tenant_id' => $quote->tenant_id,
                'customer_id' => $quote->customer_id,
                'quote_id' => $quote->id,
                'insurance_product_id' => $quote->insurance_product_id,
                'policy_number' => $this->generatePolicyNumber(),
                'status' => 'active',
                'effective_date' => now(),
                'expiry_date' => now()->addYear(),
                'coverage_details' => $quote->coverage_details,
                'premium_amount' => $quote->premium_amount,
                'commission_amount' => $quote->commission_amount,
                'total_amount' => $quote->total_amount,
                'form_data' => $quote->form_data,
                'created_by' => Auth::id(),
            ]);

            // Log activity for quote
            $this->logQuoteActivity($quote, 'converted_to_policy', "Quote converted to policy #{$policy->policy_number}");

            return $policy->load(['customer', 'insuranceProduct', 'quote']);
        });
    }

    /**
     * Duplicate a quote.
     */
    public function duplicateQuote(Quote $quote): Quote
    {
        $newQuote = $quote->duplicate();

        // Log activity
        $this->logQuoteActivity($newQuote, 'duplicated', "Duplicated from quote #{$quote->quote_number}");

        return $newQuote->load(['customer', 'insuranceProduct', 'createdBy']);
    }

    /**
     * Extend quote validity.
     */
    public function extendQuoteValidity(Quote $quote, int $days = 30): Quote
    {
        $quote->extendValidity($days);

        return $quote;
    }

    /**
     * Get quote statistics for dashboard.
     */
    public function getQuoteStatistics(int $tenantId): array
    {
        $baseQuery = Quote::forTenant($tenantId);

        return [
            'total' => $baseQuery->count(),
            'draft' => $baseQuery->byStatus(Quote::STATUS_DRAFT)->count(),
            'sent' => $baseQuery->byStatus(Quote::STATUS_SENT)->count(),
            'accepted' => $baseQuery->byStatus(Quote::STATUS_ACCEPTED)->count(),
            'rejected' => $baseQuery->byStatus(Quote::STATUS_REJECTED)->count(),
            'expired' => $baseQuery->byStatus(Quote::STATUS_EXPIRED)->count(),
            'expiring_soon' => $baseQuery->expiringWithin(7)->count(),
            'total_value' => $baseQuery->sum('total_amount'),
            'average_value' => $baseQuery->avg('total_amount') ?? 0,
            'conversion_rate' => $this->calculateConversionRate($tenantId),
        ];
    }

    /**
     * Get quotes expiring within specified days.
     */
    public function getExpiringQuotes(int $days = 7): \Illuminate\Database\Eloquent\Collection
    {
        return Quote::forTenant(Auth::user()->tenant_id)
            ->expiringWithin($days)
            ->with(['customer', 'insuranceProduct'])
            ->get();
    }

    /**
     * Mark expired quotes as expired.
     */
    public function markExpiredQuotes(): int
    {
        $expiredCount = 0;

        $expiredQuotes = Quote::where('valid_until', '<', now())
            ->where('status', Quote::STATUS_SENT)
            ->get();

        foreach ($expiredQuotes as $quote) {
            $quote->markAsExpired();
            $expiredCount++;
        }

        return $expiredCount;
    }

    /**
     * Apply filters to the query.
     */
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

    /**
     * Calculate premium based on product, coverage, and form data.
     */
    private function calculatePremium(InsuranceProduct $product, array $coverageDetails, array $formData = []): float
    {
        // Start with base premium calculation from product
        $basePremium = $product->calculatePremium($formData);

        // Apply coverage-based calculations
        $coverageMultiplier = 1.0;
        $totalCoverageAmount = 0;

        foreach ($coverageDetails as $coverage) {
            if (isset($coverage['amount']) && is_numeric($coverage['amount'])) {
                $totalCoverageAmount += (float) $coverage['amount'];
            }
        }

        // Apply coverage-based premium calculation (example: 0.1% of total coverage)
        $coveragePremium = $totalCoverageAmount * 0.001;

        // Combine base premium and coverage premium
        $totalPremium = $basePremium + $coveragePremium;

        // Apply minimum premium rules
        $minimumPremium = $product->base_premium * 0.5; // Minimum 50% of base premium

        return max($totalPremium, $minimumPremium);
    }

    /**
     * Calculate commission based on premium amount.
     */
    private function calculateCommission(float $premiumAmount, float $rate = 0.10): float
    {
        return $premiumAmount * $rate;
    }

    /**
     * Calculate conversion rate from sent quotes to accepted.
     */
    private function calculateConversionRate(int $tenantId): float
    {
        $sentQuotes = Quote::forTenant($tenantId)->byStatus(Quote::STATUS_SENT)->count();
        $acceptedQuotes = Quote::forTenant($tenantId)->byStatus(Quote::STATUS_ACCEPTED)->count();

        if ($sentQuotes === 0) {
            return 0;
        }

        return round(($acceptedQuotes / $sentQuotes) * 100, 2);
    }

    /**
     * Generate a policy number.
     */
    private function generatePolicyNumber(): string
    {
        $prefix = 'POL';
        $year = now()->format('Y');
        $sequence = Policy::whereYear('created_at', $year)->count() + 1;

        return $prefix.$year.str_pad($sequence, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Log quote activity (placeholder for activity logging).
     */
    private function logQuoteActivity(Quote $quote, string $action, string $description): void
    {
        // This would require a QuoteActivity model
        // You can implement this based on your activity logging requirements
        // For now, this is a placeholder
    }
}
