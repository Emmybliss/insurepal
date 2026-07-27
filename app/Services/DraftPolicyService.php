<?php

namespace App\Services;

use App\Models\Policy;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DraftPolicyService
{
    /**
     * Search existing tenant policies by policy number or internal reference.
     */
    public function search(int $tenantId, ?string $query, ?int $customerId = null, int $limit = 20): Collection
    {
        $q = Policy::where('tenant_id', $tenantId)
            ->with(['policyProduct:id,name', 'policyClass:id,name', 'policyType:id,name']);

        if ($customerId) {
            $q->where('customer_id', $customerId);
        }

        if (! empty($query)) {
            $term = trim($query);
            $q->where(function ($sub) use ($term) {
                $sub->where('policy_number', 'like', "%{$term}%")
                    ->orWhere('internal_reference', 'like', "%{$term}%");
            });
        }

        return $q->latest()->limit($limit)->get();
    }

    /**
     * Find existing policy by policy number / internal reference, or create a Draft Policy.
     */
    public function findOrCreateDraftPolicy(
        int $tenantId,
        int $customerId,
        ?string $policyNumber,
        array $attributes,
        int $userId
    ): Policy {
        $normalizedPolicyNumber = Policy::normalizePolicyNumber($policyNumber);

        // 1. Check if policy exists by policy_number for this tenant
        if (! empty($normalizedPolicyNumber)) {
            $existing = Policy::where('tenant_id', $tenantId)
                ->where('policy_number', $normalizedPolicyNumber)
                ->first();

            if ($existing) {
                return $existing;
            }
        }

        // 2. Check if internal_reference was supplied and matches an existing policy
        if (! empty($attributes['internal_reference'])) {
            $existingRef = Policy::where('tenant_id', $tenantId)
                ->where('internal_reference', trim($attributes['internal_reference']))
                ->first();

            if ($existingRef) {
                return $existingRef;
            }
        }

        // 3. Atomically create a new Draft Policy to prevent race conditions
        return DB::transaction(function () use ($tenantId, $customerId, $normalizedPolicyNumber, $attributes, $userId) {
            // Double check inside transaction for race conditions
            if (! empty($normalizedPolicyNumber)) {
                $existing = Policy::where('tenant_id', $tenantId)
                    ->where('policy_number', $normalizedPolicyNumber)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    return $existing;
                }
            }

            $internalRef = Policy::generateInternalReference($tenantId);
            $effectiveDate = $attributes['effective_date'] ?? $attributes['issue_date'] ?? now()->toDateString();
            $expiryDate = $attributes['expiry_date'] ?? $attributes['due_date'] ?? \Illuminate\Support\Carbon::parse($effectiveDate)->addYear()->toDateString();
            $premiumAmount = (float) ($attributes['amount'] ?? $attributes['premium_amount'] ?? 0);
            $totalAmount = (float) ($attributes['total_amount'] ?? $premiumAmount);
            $currency = $attributes['currency_code'] ?? $attributes['currency'] ?? 'NGN';

            $productId = $attributes['policy_product_id'] ?? null;
            if (! $productId) {
                $productId = \App\Models\PolicyProduct::where('tenant_id', $tenantId)->value('id');
                if (! $productId) {
                    $type = \App\Models\PolicyType::firstOrCreate(
                        ['code' => 'GEN'],
                        ['name' => 'General Insurance', 'is_active' => true]
                    );
                    $class = \App\Models\PolicyClass::firstOrCreate(
                        ['policy_type_id' => $type->id, 'code' => 'GEN-MISC'],
                        ['name' => 'General Miscellaneous', 'is_active' => true]
                    );
                    $product = \App\Models\PolicyProduct::create([
                        'tenant_id' => $tenantId,
                        'policy_type_id' => $type->id,
                        'policy_class_id' => $class->id,
                        'name' => 'General Policy Product',
                        'code' => 'GEN-PROD-'.strtoupper(\Illuminate\Support\Str::random(4)),
                        'is_active' => true,
                    ]);
                    $productId = $product->id;
                }
            }

            return Policy::create([
                'tenant_id' => $tenantId,
                'customer_id' => $customerId,
                'policy_number' => $normalizedPolicyNumber, // NULL if not entered (displaying TBA)
                'internal_reference' => $internalRef,
                'status' => Policy::STATUS_DRAFT,
                'effective_date' => $effectiveDate,
                'expiry_date' => $expiryDate,
                'coverage_details' => $attributes['coverage_details'] ?? [],
                'premium_amount' => $premiumAmount,
                'commission_amount' => (float) ($attributes['commission_amount'] ?? 0),
                'commission_rate' => (float) ($attributes['commission_rate'] ?? 0),
                'total_amount' => $totalAmount,
                'sum_insured' => isset($attributes['sum_insured']) ? (float) $attributes['sum_insured'] : null,
                'currency' => $currency,
                'policy_type_id' => $attributes['policy_type_id'] ?? null,
                'policy_class_id' => $attributes['policy_class_id'] ?? null,
                'policy_product_id' => $productId,
                'created_by' => $userId,
                'broker_id' => $attributes['broker_id'] ?? null,
                'insurer_id' => $attributes['insurer_id'] ?? null,
                'source_type' => Policy::SOURCE_BROKER_RECORDED,
            ]);
        });
    }
}
