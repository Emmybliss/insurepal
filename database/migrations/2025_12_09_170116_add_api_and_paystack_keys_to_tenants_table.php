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
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('api_key')->nullable()->unique()->after('status');
            $table->string('public_key')->nullable()->unique()->after('api_key');
            $table->string('paystack_public_key')->nullable()->after('public_key');
            $table->string('paystack_secret_key')->nullable()->after('paystack_public_key');
            $table->string('paystack_webhook_secret')->nullable()->after('paystack_secret_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'api_key',
                'public_key',
                'paystack_public_key',
                'paystack_secret_key',
                'paystack_webhook_secret',
            ]);
        });
    }
};
