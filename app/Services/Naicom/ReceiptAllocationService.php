<?php

namespace App\Services\Naicom;

use App\Enums\AllocationType;
use App\Models\Policy;
use App\Models\Receipt;
use App\Models\ReceiptAllocation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReceiptAllocationService
{
    public function allocate(Receipt $receipt, array $allocations): Collection
    {
        return DB::transaction(function () use ($receipt, $allocations) {
            $receipt->receiptAllocations()->delete();

            $created = collect();

            foreach ($allocations as $allocation) {
                $created->push(
                    ReceiptAllocation::create([
                        'tenant_id' => $receipt->tenant_id,
                        'receipt_id' => $receipt->id,
                        'policy_id' => $allocation['policy_id'] ?? null,
                        'allocation_type' => $allocation['allocation_type'],
                        'amount' => $allocation['amount'],
                        'currency' => $allocation['currency'] ?? $receipt->currency ?? 'NGN',
                        'exchange_rate' => $allocation['exchange_rate'] ?? 1.0,
                        'is_direct_to_insurer' => $allocation['is_direct_to_insurer'] ?? false,
                        'notes' => $allocation['notes'] ?? null,
                    ])
                );
            }

            return $created;
        });
    }

    public function validateAllocations(Receipt $receipt, array $allocations): array
    {
        $errors = [];

        $totalAllocated = collect($allocations)->sum('amount');

        if (bccomp((string) $totalAllocated, (string) $receipt->amount_paid, 2) > 0) {
            $errors[] = 'Allocation total ('.number_format($totalAllocated, 2).') exceeds receipt amount ('.number_format($receipt->amount_paid, 2).')';
        }

        foreach ($allocations as $i => $allocation) {
            if (! isset($allocation['amount']) || (float) $allocation['amount'] <= 0) {
                $errors[] = "Allocation #{$i}: amount must be positive";
            }

            if (! isset($allocation['allocation_type'])) {
                $errors[] = "Allocation #{$i}: allocation type is required";
            }
        }

        return $errors;
    }

    public function getPolicyAllocations(Policy $policy): Collection
    {
        return ReceiptAllocation::query()
            ->where('policy_id', $policy->id)
            ->with(['receipt'])
            ->get();
    }

    public function getTotalAllocatedByType(Policy $policy, ?AllocationType $type = null): string
    {
        $query = ReceiptAllocation::query()
            ->where('policy_id', $policy->id);

        if ($type) {
            $query->where('allocation_type', $type);
        }

        return $query->sum('amount');
    }

    public function autoAllocateFromPolicy(Receipt $receipt): Collection
    {
        $policy = $receipt->policy;

        if (! $policy) {
            return collect();
        }

        $allocations = [];

        $premiumAmount = $policy->premium_amount;

        if ($receipt->amount_paid >= $premiumAmount) {
            $allocations[] = [
                'policy_id' => $policy->id,
                'allocation_type' => AllocationType::Premium,
                'amount' => $premiumAmount,
                'currency' => $receipt->currency ?? 'NGN',
                'exchange_rate' => 1.0,
                'is_direct_to_insurer' => false,
            ];

            $remaining = bcsub((string) $receipt->amount_paid, (string) $premiumAmount, 2);

            if (bccomp($remaining, '0', 2) > 0 && $policy->commission_amount > 0) {
                $commissionAmount = min($remaining, (string) $policy->commission_amount);

                $allocations[] = [
                    'policy_id' => $policy->id,
                    'allocation_type' => AllocationType::Commission,
                    'amount' => $commissionAmount,
                    'currency' => $receipt->currency ?? 'NGN',
                    'exchange_rate' => 1.0,
                    'is_direct_to_insurer' => false,
                ];

                $remaining = bcsub($remaining, (string) $commissionAmount, 2);
            }

            if (bccomp($remaining, '0', 2) > 0) {
                $allocations[] = [
                    'policy_id' => $policy->id,
                    'allocation_type' => AllocationType::Fee,
                    'amount' => $remaining,
                    'currency' => $receipt->currency ?? 'NGN',
                    'exchange_rate' => 1.0,
                    'is_direct_to_insurer' => false,
                ];
            }
        } else {
            $allocations[] = [
                'policy_id' => $policy->id,
                'allocation_type' => AllocationType::Premium,
                'amount' => $receipt->amount_paid,
                'currency' => $receipt->currency ?? 'NGN',
                'exchange_rate' => 1.0,
                'is_direct_to_insurer' => false,
            ];
        }

        return $this->allocate($receipt, $allocations);
    }
}
