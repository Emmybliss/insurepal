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
            $table->string('currency', 3)->default('NGN')->after('net_premium');
            $table->string('payment_method', 50)->nullable()->after('payment_frequency');
            $table->date('payment_date')->nullable()->after('payment_method');
            $table->boolean('is_direct_to_insurer')->default(false)->after('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn(['currency', 'payment_method', 'payment_date', 'is_direct_to_insurer']);
        });
    }
};
