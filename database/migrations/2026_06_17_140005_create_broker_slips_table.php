<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('broker_slips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('placement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('placement_market_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slip_number')->unique();
            $table->integer('version')->default(1);
            $table->string('currency', 3)->default('NGN');
            $table->decimal('sum_insured', 18, 2)->default(0);
            $table->decimal('rate', 10, 4)->nullable();
            $table->string('rate_basis')->nullable();
            $table->decimal('gross_premium', 18, 2)->default(0);
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->decimal('commission_amount', 18, 2)->nullable();
            $table->decimal('co_broker_commission', 18, 2)->nullable();
            $table->decimal('reporting_broker_commission', 18, 2)->nullable();
            $table->decimal('fees', 18, 2)->nullable();
            $table->decimal('taxes', 18, 2)->nullable();
            $table->decimal('discount', 18, 2)->nullable();
            $table->decimal('net_premium', 18, 2)->default(0);
            $table->date('period_start');
            $table->date('period_end');
            $table->text('claim_payment_condition')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('document_template_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('issued_at')->nullable();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('signed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('pdf_path')->nullable();
            $table->string('checksum', 64)->nullable();
            $table->json('snapshot_json')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['placement_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broker_slips');
    }
};
