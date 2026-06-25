<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('naicom_report_runs', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'reporting_year', 'reporting_half']);
        });
    }

    public function down(): void
    {
        Schema::table('naicom_report_runs', function (Blueprint $table) {
            $table->unique(['tenant_id', 'reporting_year', 'reporting_half']);
        });
    }
};
