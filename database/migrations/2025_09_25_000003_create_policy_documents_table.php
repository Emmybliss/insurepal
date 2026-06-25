<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('policy_id');
            $table->unsignedBigInteger('policy_amendment_id')->nullable();
            $table->enum('document_type', [
                'policy_certificate',
                'policy_schedule',
                'amendment_certificate',
                'renewal_notice',
                'cancellation_notice',
                'endorsement',
                'claim_form',
                'terms_conditions',
                'coverage_summary',
                'payment_receipt',
            ]);
            $table->string('document_name');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type', 10); // pdf, docx, etc
            $table->unsignedBigInteger('file_size')->default(0);
            $table->enum('status', [
                'generating',
                'generated',
                'sent',
                'failed',
                'archived',
            ])->default('generating');
            $table->json('generation_data')->nullable(); // Data used to generate document
            $table->text('generation_error')->nullable();
            $table->boolean('is_customer_facing')->default(true);
            $table->boolean('requires_signature')->default(false);
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('downloaded_at')->nullable();
            $table->unsignedBigInteger('generated_by');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('policy_id')->references('id')->on('policies')->onDelete('cascade');
            $table->foreign('policy_amendment_id')->references('id')->on('policy_amendments')->onDelete('set null');
            $table->foreign('generated_by')->references('id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index(['tenant_id', 'document_type']);
            $table->index(['policy_id', 'document_type']);
            $table->index(['document_type', 'status']);
            $table->index('generated_at');
            $table->index(['is_customer_facing', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_documents');
    }
};
