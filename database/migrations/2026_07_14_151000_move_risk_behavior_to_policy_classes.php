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
        Schema::table('policy_products', function (Blueprint $table) {
            if (Schema::hasColumn('policy_products', 'supports_multiple_risks')) {
                $table->dropColumn('supports_multiple_risks');
            }
            if (Schema::hasColumn('policy_products', 'risk_mode')) {
                $table->dropColumn('risk_mode');
            }
        });

        Schema::table('policy_classes', function (Blueprint $table) {
            if (! Schema::hasColumn('policy_classes', 'risk_mode')) {
                $table->string('risk_mode')->default('single')->after('description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policy_classes', function (Blueprint $table) {
            if (Schema::hasColumn('policy_classes', 'risk_mode')) {
                $table->dropColumn('risk_mode');
            }
        });

        Schema::table('policy_products', function (Blueprint $table) {
            $table->boolean('supports_multiple_risks')->default(false);
            $table->string('risk_mode')->default('single');
        });
    }
};
