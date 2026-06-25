<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('placement_markets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('placement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('insurance_company_id')->constrained()->cascadeOnDelete();
            $table->string('insurer_branch')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_email')->nullable();
            $table->boolean('is_lead')->default(false);
            $table->decimal('participation_percentage', 5, 2)->nullable();
            $table->decimal('offered_rate', 10, 4)->nullable();
            $table->string('rate_basis')->nullable();
            $table->decimal('gross_premium', 18, 2)->nullable();
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->decimal('commission_amount', 18, 2)->nullable();
            $table->decimal('co_broker_commission', 18, 2)->nullable();
            $table->decimal('reporting_broker_commission', 18, 2)->nullable();
            $table->decimal('fees', 18, 2)->nullable();
            $table->decimal('taxes', 18, 2)->nullable();
            $table->decimal('net_premium', 18, 2)->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('response_date')->nullable();
            $table->text('response_notes')->nullable();
            $table->string('insurer_reference')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['placement_id', 'insurance_company_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('placement_markets');
    }
};
