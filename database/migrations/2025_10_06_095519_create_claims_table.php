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
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('policy_id')->constrained()->onDelete('restrict');
            $table->foreignId('customer_id')->constrained()->onDelete('restrict');
            $table->string('claim_reference')->unique();
            $table->enum('claim_type', [
                'accident',
                'theft',
                'damage',
                'fire',
                'flood',
                'medical',
                'death',
                'disability',
                'liability',
                'other',
            ])->default('other');
            $table->date('incident_date');
            $table->text('incident_description');
            $table->string('incident_location')->nullable();
            $table->decimal('claim_amount', 15, 2);
            $table->decimal('approved_amount', 15, 2)->nullable();
            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'info_requested',
                'approved',
                'rejected',
                'settled',
                'closed',
            ])->default('draft');
            $table->text('decision_notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->json('metadata')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('settled_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['tenant_id', 'status']);
            $table->index(['policy_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index('claim_reference');
            $table->index('incident_date');
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claims');
    }
};
