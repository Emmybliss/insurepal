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
        Schema::table('policies', function (Blueprint $table) {
            $table->decimal('sum_insured', 18, 2)->nullable()->after('coverage_details');
            $table->decimal('net_premium', 18, 2)->nullable()->after('premium_amount');
        });
    }

    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn(['sum_insured', 'net_premium']);
        });
    }
};
