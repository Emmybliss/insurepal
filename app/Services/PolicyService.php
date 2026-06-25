<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Policy;
use App\Models\PolicyProduct;
use App\Models\Tenant;
use Carbon\Carbon;

class PolicyService
{
    /**
     * Create and Issue a Policy directly from Payment/Webhook context.
     */
    public function issuePolicy(Tenant $tenant, Customer $customer, PolicyProduct $product, array $paymentData = []): Policy
    {
        // Calculate dates
        $startDate = Carbon::parse($paymentData['start_date'] ?? now());
        $durationDays = $product->default_coverage_period ?? 365;
        $endDate = $paymentData['end_date'] ?? $startDate->copy()->addDays($durationDays);

        // Generate Policy Number
        $policyNumber = Policy::generatePolicyNumber($tenant->id, $product->code ?? 'POL');

        // Create the Policy
        $policy = Policy::create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'policy_product_id' => $product->id,
            'policy_number' => $policyNumber,
            'source_type' => Policy::SOURCE_DIRECT_ISSUANCE,
            'status' => Policy::STATUS_ACTIVE, // Instant issuance
            'approval_status' => Policy::APPROVAL_APPROVED, // Auto-approved via payment
            'effective_date' => $startDate,
            'expiry_date' => $endDate,
            'premium_amount' => $paymentData['amount'] ?? 0, // In main currency (Naira), not kobo
            'total_amount' => $paymentData['amount'] ?? 0,
            'payment_frequency' => 'one-off',
            'issued_at' => now(),
            'approved_at' => now(),
            'created_by' => null, // System generated
            'form_data' => $paymentData['form_data'] ?? [],
        ]);

        return $policy;
    }
}
