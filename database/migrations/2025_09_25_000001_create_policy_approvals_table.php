<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_approvals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('policy_id');
            $table->unsignedBigInteger('requested_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->enum('status', [
                'pending',
                'under_review',
                'approved',
                'rejected',
                'cancelled',
            ])->default('pending');
            $table->enum('approval_type', [
                'new_policy',
                'policy_amendment',
                'policy_renewal',
                'policy_reinstatement',
            ])->default('new_policy');
            $table->decimal('policy_amount', 15, 2);
            $table->json('approval_data')->nullable(); // Store policy details for review
            $table->text('request_notes')->nullable();
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('requested_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('policy_id')->references('id')->on('policies')->onDelete('cascade');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index(['tenant_id', 'status']);
            $table->index(['policy_id', 'status']);
            $table->index(['requested_by']);
            $table->index(['approved_by']);
            $table->index('requested_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_approvals');
    }
};
