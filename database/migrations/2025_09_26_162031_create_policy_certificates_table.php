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
        Schema::create('policy_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->foreignId('certificate_template_id')->constrained()->onDelete('restrict');
            $table->string('certificate_number')->unique();
            $table->string('type')->default('policy_certificate');
            $table->string('status')->default('draft'); // draft, generated, issued, cancelled
            $table->json('certificate_data'); // Merged policy and template data
            $table->json('generation_metadata')->nullable(); // Generation settings used
            $table->string('file_path')->nullable(); // Path to generated PDF
            $table->string('file_name')->nullable();
            $table->integer('file_size')->nullable();
            $table->string('file_hash')->nullable(); // For integrity verification
            $table->string('barcode_data')->nullable();
            $table->string('qr_code_data')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('generated_by')->nullable()->constrained('users');
            $table->foreignId('issued_by')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            $table->json('audit_trail')->nullable(); // Track changes and access
            $table->timestamps();

            $table->index(['tenant_id', 'policy_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['certificate_number']);
            $table->index(['generated_at', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policy_certificates');
    }
};
