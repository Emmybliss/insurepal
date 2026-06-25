<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained()->onDelete('set null');
            $table->string('reference')->unique();
            $table->string('paystack_reference')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('NGN');
            $table->enum('channel', ['card', 'bank_transfer', 'ussd', 'mobile_money', 'cash'])->nullable();
            $table->enum('status', ['pending', 'success', 'failed', 'reversed', 'abandoned'])->default('pending');
            $table->string('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();

            // Commission split record (stored for audit even before wallet credits)
            $table->decimal('insurer_amount', 15, 2)->nullable();
            $table->decimal('broker_amount', 15, 2)->nullable();
            $table->decimal('platform_amount', 15, 2)->nullable();
            $table->foreignId('commission_rule_id')->nullable()->constrained('commission_rules')->onDelete('set null');

            // Flags for post-payment processing
            $table->boolean('wallets_credited')->default(false);
            $table->boolean('receipt_generated')->default(false);

            $table->json('metadata')->nullable();
            $table->string('idempotency_key')->unique()->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['policy_id', 'status']);
            $table->index(['customer_id', 'created_at']);
            $table->index('reference');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_payments');
    }
};
