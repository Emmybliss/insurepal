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
            $table->boolean('onboarding_completed')->default(false)->after('status');
            $table->json('onboarding_steps')->nullable()->after('onboarding_completed');
            $table->timestamp('onboarding_completed_at')->nullable()->after('onboarding_steps');
            $table->foreignId('subscription_plan_id')->nullable()->after('onboarding_completed_at')->constrained('subscription_plans')->nullOnDelete();
            $table->string('paystack_customer_code')->nullable()->after('subscription_plan_id');
            $table->string('paystack_subscription_code')->nullable()->after('paystack_customer_code');
            $table->timestamp('subscription_started_at')->nullable()->after('paystack_subscription_code');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['subscription_plan_id']);
            $table->dropColumn([
                'onboarding_completed',
                'onboarding_steps',
                'onboarding_completed_at',
                'subscription_plan_id',
                'paystack_customer_code',
                'paystack_subscription_code',
                'subscription_started_at',
                'subscription_expires_at',
            ]);
        });
    }
};
