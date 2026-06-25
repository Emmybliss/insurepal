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
        Schema::create('claim_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained()->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('restrict');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type', 50);
            $table->unsignedBigInteger('file_size')->comment('Size in bytes');
            $table->enum('document_type', [
                'incident_photo',
                'police_report',
                'medical_report',
                'repair_estimate',
                'invoice',
                'receipt',
                'witness_statement',
                'correspondence',
                'other',
            ])->default('other');
            $table->text('description')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('claim_id');
            $table->index('uploaded_by');
            $table->index('document_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_documents');
    }
};
