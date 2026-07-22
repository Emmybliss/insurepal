<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_products', function (Blueprint $table) {
            $table->string('coverage_label', 100)
                ->default('Sum Insured')
                ->after('currency');
        });

        // Seed smart defaults per product
        DB::table('policy_products')
            ->whereIn('name', [
                'Level Term Life Insurance',
                'Whole Life Insurance',
            ])
            ->update(['coverage_label' => 'Sum Assured']);
    }

    public function down(): void
    {
        Schema::table('policy_products', function (Blueprint $table) {
            $table->dropColumn('coverage_label');
        });
    }
};
