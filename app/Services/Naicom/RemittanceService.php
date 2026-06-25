<?php

namespace App\Services\Naicom;

use App\Enums\RemittanceStatus;
use App\Models\Remittance;
use App\Models\RemittanceAllocation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RemittanceService
{
    public function create(array $data): Remittance
    {
        return DB::transaction(function () use ($data) {
            $remittance = Remittance::create([
                'tenant_id' => $data['tenant_id'],
                'remittance_number' => $data['remittance_number'] ?? $this->generateRemittanceNumber($data['tenant_id']),
                'client_bank_account_id' => $data['client_bank_account_id'] ?? null,
                'insurer_id' => $data['insurer_id'] ?? null,
                'remittance_date' => $data['remittance_date'],
                'total_amount' => $data['total_amount'],
                'currency' => $data['currency'] ?? 'NGN',
                'payment_method' => $data['payment_method'],
                'reference' => $data['reference'] ?? null,
                'status' => RemittanceStatus::Draft,
                'notes' => $data['notes'] ?? null,
                'created_by' => $data['created_by'],
            ]);

            if (isset($data['allocations']) && is_array($data['allocations'])) {
                $this->addAllocations($remittance, $data['allocations']);
            }

            return $remittance;
        });
    }

    public function addAllocations(Remittance $remittance, array $allocations): Collection
    {
        $created = collect();

        foreach ($allocations as $allocation) {
            $created->push(
                RemittanceAllocation::create([
                    'tenant_id' => $remittance->tenant_id,
                    'remittance_id' => $remittance->id,
                    'allocatable_type' => $allocation['allocatable_type'] ?? null,
                    'allocatable_id' => $allocation['allocatable_id'] ?? null,
                    'allocation_type' => $allocation['allocation_type'],
                    'amount' => $allocation['amount'],
                    'currency' => $allocation['currency'] ?? $remittance->currency ?? 'NGN',
                    'notes' => $allocation['notes'] ?? null,
                ])
            );
        }

        $remittance->load('allocations');

        return $created;
    }

    public function markCompleted(Remittance $remittance): Remittance
    {
        $remittance->update(['status' => RemittanceStatus::Completed]);

        return $remittance->fresh();
    }

    public function reverse(Remittance $remittance, int $reversedBy, string $reason): Remittance
    {
        if ($remittance->status === RemittanceStatus::Reversed) {
            throw new \RuntimeException('Remittance already reversed');
        }

        return DB::transaction(function () use ($remittance, $reversedBy, $reason) {
            $remittance->update([
                'status' => RemittanceStatus::Reversed,
                'reversal_reason' => $reason,
                'reversed_at' => now(),
                'reversed_by' => $reversedBy,
            ]);

            return $remittance->fresh();
        });
    }

    public function validateAllocations(Remittance $remittance, array $allocations): array
    {
        $errors = [];

        $totalAllocated = collect($allocations)->sum('amount');

        if ($totalAllocated > $remittance->total_amount) {
            $errors[] = 'Allocation total ('.number_format($totalAllocated, 2).') exceeds remittance amount ('.number_format($remittance->total_amount, 2).')';
        }

        foreach ($allocations as $i => $allocation) {
            if (! isset($allocation['allocation_type'])) {
                $errors[] = "Allocation #{$i}: allocation type is required";
            }

            if (! isset($allocation['amount']) || $allocation['amount'] <= 0) {
                $errors[] = "Allocation #{$i}: amount must be positive";
            }
        }

        return $errors;
    }

    public function generateRemittanceNumber(int $tenantId): string
    {
        $prefix = 'REM';
        $year = now()->year;

        $lastRemittance = Remittance::query()
            ->where('tenant_id', $tenantId)
            ->where('remittance_number', 'like', "{$prefix}-{$year}-%")
            ->orderBy('remittance_number', 'desc')
            ->first();

        if ($lastRemittance) {
            $lastNumber = (int) substr($lastRemittance->remittance_number, -6);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%s-%06d', $prefix, $year, $nextNumber);
    }

    public function getRemittancesForPeriod(int $tenantId, string $startDate, string $endDate): Collection
    {
        return Remittance::query()
            ->where('tenant_id', $tenantId)
            ->whereBetween('remittance_date', [$startDate, $endDate])
            ->with(['allocations', 'insurer', 'clientBankAccount', 'createdBy'])
            ->orderBy('remittance_date')
            ->get();
    }

    public function getRemittancesByInsurer(int $tenantId, int $insurerId): Collection
    {
        return Remittance::query()
            ->where('tenant_id', $tenantId)
            ->where('insurer_id', $insurerId)
            ->with(['allocations', 'clientBankAccount'])
            ->orderBy('remittance_date', 'desc')
            ->get();
    }
}
