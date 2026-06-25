<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_amendments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('policy_id');
            $table->string('amendment_number')->unique();
            $table->enum('amendment_type', [
                'coverage_change',
                'premium_adjustment',
                'beneficiary_change',
                'policy_details_update',
                'term_extension',
                'endorsement',
                'correction',
            ]);
            $table->enum('status', [
                'draft',
                'pending_approval',
                'approved',
                'rejected',
                'active',
                'cancelled',
            ])->default('draft');
            $table->json('original_data'); // Store original policy data
            $table->json('amended_data'); // Store new/changed data
            $table->json('changes_summary'); // Human-readable summary of changes
            $table->decimal('premium_adjustment', 15, 2)->default(0);
            $table->decimal('new_premium_amount', 15, 2)->nullable();
            $table->date('effective_date');
            $table->text('amendment_reason');
            $table->text('internal_notes')->nullable();
            $table->text('customer_notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('policy_id')->references('id')->on('policies')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['tenant_id', 'status']);
            $table->index(['policy_id', 'status']);
            $table->index('amendment_number');
            $table->index('effective_date');
            $table->index(['amendment_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_amendments');
    }
};
