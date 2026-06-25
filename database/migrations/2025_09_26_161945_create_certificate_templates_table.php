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
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('type')->default('policy_certificate'); // policy_certificate, policy_schedule, endorsement
            $table->string('category')->default('standard'); // standard, premium, corporate
            $table->text('description')->nullable();
            $table->json('layout_config'); // Template layout configuration
            $table->json('field_mappings'); // Field to data mappings
            $table->json('style_config'); // Colors, fonts, spacing
            $table->json('header_config')->nullable(); // Logo, company info positioning
            $table->json('footer_config')->nullable(); // Signatures, seals positioning
            $table->json('barcode_config')->nullable(); // Barcode settings
            $table->string('page_size')->default('A4'); // A4, Letter, Legal
            $table->string('orientation')->default('portrait'); // portrait, landscape
            $table->boolean('include_watermark')->default(false);
            $table->string('watermark_text')->nullable();
            $table->boolean('include_barcode')->default(true);
            $table->boolean('include_qr_code')->default(true);
            $table->boolean('include_seal')->default(true);
            $table->boolean('include_signatures')->default(true);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['tenant_id', 'type', 'is_active']);
            $table->index(['tenant_id', 'is_default']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_templates');
    }
};
