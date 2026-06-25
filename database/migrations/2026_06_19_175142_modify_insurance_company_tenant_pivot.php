<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_company_tenant', function (Blueprint $table) {
            $table->foreignId('insurance_company_branch_id')
                ->nullable()
                ->after('insurance_company_id')
                ->constrained('insurance_company_branches')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('insurance_company_tenant', function (Blueprint $table) {
            $table->dropForeign(['insurance_company_branch_id']);
            $table->dropColumn('insurance_company_branch_id');
        });
    }
};
