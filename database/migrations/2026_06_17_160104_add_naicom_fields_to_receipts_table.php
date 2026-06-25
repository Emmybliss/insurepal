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
        Schema::table('receipts', function (Blueprint $table) {
            $table->unsignedBigInteger('client_bank_account_id')->nullable()->after('policy_id');
            $table->timestamp('cleared_at')->nullable()->after('payment_date');
            $table->boolean('is_cleared')->default(false)->after('cleared_at');

            $table->index('client_bank_account_id');
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropColumn(['client_bank_account_id', 'cleared_at', 'is_cleared']);
        });
    }
};
