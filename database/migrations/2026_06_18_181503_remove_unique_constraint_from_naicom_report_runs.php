<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('naicom_report_runs', function (Blueprint $table) {
            $table->dropUnique('nrr_tenant_year_half_unique');
        });
    }

    public function down(): void
    {
        // Only restore the unique constraint if no duplicate combinations exist.
        $hasDuplicates = \Illuminate\Support\Facades\DB::table('naicom_report_runs')
            ->select('tenant_id', 'reporting_year', 'reporting_half')
            ->groupBy('tenant_id', 'reporting_year', 'reporting_half')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if (! $hasDuplicates) {
            Schema::table('naicom_report_runs', function (Blueprint $table) {
                $table->unique(['tenant_id', 'reporting_year', 'reporting_half'], 'nrr_tenant_year_half_unique');
            });
        }
    }
};
