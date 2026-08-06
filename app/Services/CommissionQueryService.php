<?php

namespace App\Services;

use App\Enums\CommissionTransactionType;
use App\Models\CommissionEntry;
use App\Models\Policy;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CommissionQueryService
{
    public function getNetCommission(Policy $policy): float
    {
        return (float) CommissionEntry::where('policy_id', $policy->id)
            ->sum('amount');
    }

    public function getGrossCommission(Policy $policy): float
    {
        return (float) CommissionEntry::where('policy_id', $policy->id)
            ->whereIn('transaction_type', [
                CommissionTransactionType::Policy->value,
                CommissionTransactionType::Renewal->value,
            ])
            ->sum('amount');
    }

    public function getCommissionBreakdown(Policy $policy): Collection
    {
        return CommissionEntry::where('policy_id', $policy->id)
            ->orderBy('posting_date')
            ->orderBy('created_at')
            ->get();
    }

    public function getEarnedCommission(Policy $policy, ?Carbon $asOf = null): float
    {
        $query = CommissionEntry::where('policy_id', $policy->id);

        if ($asOf) {
            $query->where('posting_date', '<=', $asOf->toDateString());
        }

        return (float) $query->sum('amount');
    }

    public function getReversedCommission(Policy $policy): float
    {
        return (float) CommissionEntry::where('policy_id', $policy->id)
            ->where('transaction_type', CommissionTransactionType::Reversal->value)
            ->sum('amount');
    }

    public function getCommissionBalance(Policy $policy): float
    {
        return $this->getNetCommission($policy);
    }

    public function getCommissionByDateRange(Carbon $from, Carbon $to, ?int $tenantId = null): Collection
    {
        $query = CommissionEntry::whereBetween('posting_date', [$from->toDateString(), $to->toDateString()]);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        return $query->orderBy('posting_date')->get();
    }

    public function getTotalCommissionByTenant(int $tenantId, ?Carbon $from = null, ?Carbon $to = null): float
    {
        $query = CommissionEntry::where('tenant_id', $tenantId);

        if ($from) {
            $query->where('posting_date', '>=', $from->toDateString());
        }

        if ($to) {
            $query->where('posting_date', '<=', $to->toDateString());
        }

        return (float) $query->sum('amount');
    }

    public function getMonthlyCommissionTotals(int $tenantId, int $year): Collection
    {
        return CommissionEntry::where('tenant_id', $tenantId)
            ->whereYear('posting_date', $year)
            ->select(
                DB::raw('MONTH(posting_date) as month'),
                DB::raw('SUM(amount) as total'),
            )
            ->groupBy(DB::raw('MONTH(posting_date)'))
            ->orderBy('month')
            ->get();
    }

    public function getCommissionByTransactionType(Policy $policy): Collection
    {
        return CommissionEntry::where('policy_id', $policy->id)
            ->select(
                'transaction_type',
                DB::raw('SUM(amount) as total'),
            )
            ->groupBy('transaction_type')
            ->get();
    }

    public function getCommissionByDate(int $tenantId, Carbon $from, Carbon $to): Collection
    {
        $driver = DB::connection()->getDriverName();

        $dateExpr = $driver === 'sqlite'
            ? "strftime('%Y-%m', posting_date)"
            : "DATE_FORMAT(posting_date, '%Y-%m')";

        return CommissionEntry::where('commission_entries.tenant_id', $tenantId)
            ->whereBetween('posting_date', [$from->toDateString(), $to->toDateString()])
            ->leftJoin('policies', 'commission_entries.policy_id', '=', 'policies.id')
            ->select(
                DB::raw("{$dateExpr} as label"),
                DB::raw('SUM(commission_entries.amount) as value'),
                DB::raw('SUM(COALESCE(policies.premium_amount, 0)) as premium'),
            )
            ->groupBy(DB::raw($dateExpr))
            ->orderBy('label')
            ->get();
    }

    public function getCommissionByPolicyClass(int $tenantId, Carbon $from, Carbon $to): Collection
    {
        return CommissionEntry::where('commission_entries.tenant_id', $tenantId)
            ->whereBetween('posting_date', [$from->toDateString(), $to->toDateString()])
            ->join('policies', 'commission_entries.policy_id', '=', 'policies.id')
            ->join('policy_classes', 'policies.policy_class_id', '=', 'policy_classes.id')
            ->select(
                'policy_classes.name as label',
                DB::raw('SUM(commission_entries.amount) as value'),
                DB::raw('SUM(COALESCE(policies.premium_amount, 0)) as premium'),
            )
            ->groupBy('policy_classes.name')
            ->orderBy('value', 'desc')
            ->get();
    }

    public function getCommissionByPolicyProduct(int $tenantId, Carbon $from, Carbon $to): Collection
    {
        return CommissionEntry::where('commission_entries.tenant_id', $tenantId)
            ->whereBetween('posting_date', [$from->toDateString(), $to->toDateString()])
            ->join('policies', 'commission_entries.policy_id', '=', 'policies.id')
            ->join('policy_products', 'policies.policy_product_id', '=', 'policy_products.id')
            ->select(
                'policy_products.name as label',
                DB::raw('SUM(commission_entries.amount) as value'),
                DB::raw('SUM(COALESCE(policies.premium_amount, 0)) as premium'),
            )
            ->groupBy('policy_products.name')
            ->orderBy('value', 'desc')
            ->get();
    }
}
