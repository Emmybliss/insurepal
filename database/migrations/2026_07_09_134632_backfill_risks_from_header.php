<?php

use App\Models\BrokerSlip;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        BrokerSlip::whereDoesntHave('risks')->each(function (BrokerSlip $slip) {
            $slip->risks()->create([
                'tenant_id' => $slip->tenant_id,
                'item_type' => 'general',
                'description' => 'Primary Risk',
                'coverage_amount' => $slip->sum_insured ?? 0,
                'rate' => $slip->rate,
                'rate_basis' => $slip->rate_basis,
                'premium' => $slip->gross_premium ?? 0,
                'net_premium' => $slip->net_premium ?? 0,
                'commission_rate' => $slip->commission_rate,
                'commission_amount' => $slip->commission_amount,
                'taxes' => $slip->taxes,
                'fees' => $slip->fees,
                'sort_order' => 0,
            ]);
        });
    }

    public function down(): void
    {
        // No meaningful rollback — data was synthetic
    }
};
