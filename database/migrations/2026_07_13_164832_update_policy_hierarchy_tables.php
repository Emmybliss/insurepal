<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('policy_classes', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('policy_classes', 'form_fields')) {
                $columnsToDrop[] = 'form_fields';
            }
            if (Schema::hasColumn('policy_classes', 'risk_factors')) {
                $columnsToDrop[] = 'risk_factors';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        Schema::table('policy_products', function (Blueprint $table) {
            $table->boolean('requires_inspection')->default(false)->after('requires_medical_exam');
            $table->boolean('requires_valuation')->default(false)->after('requires_inspection');
            $table->boolean('supports_installment_premium')->default(false)->after('requires_valuation');
            $table->boolean('allows_coinsurance')->default(false)->after('supports_installment_premium');
            $table->boolean('allows_reinsurance')->default(false)->after('allows_coinsurance');
            $table->boolean('requires_sum_insured')->default(false)->after('allows_reinsurance');
            $table->string('default_rate_basis')->nullable()->after('default_coverage_period');
            $table->string('risk_mode')->default('single')->after('default_rate_basis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policy_classes', function (Blueprint $table) {
            $table->json('form_fields')->nullable()->after('is_active');
            $table->json('risk_factors')->nullable()->after('commission_multiplier');
        });

        Schema::table('policy_products', function (Blueprint $table) {
            $table->dropColumn([
                'requires_inspection',
                'requires_valuation',
                'supports_installment_premium',
                'allows_coinsurance',
                'allows_reinsurance',
                'requires_sum_insured',
                'default_rate_basis',
                'risk_mode',
            ]);
        });
    }
};
