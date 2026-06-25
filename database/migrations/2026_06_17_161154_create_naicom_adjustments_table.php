<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('naicom_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_run_id')->constrained('naicom_report_runs')->onDelete('cascade');
            $table->unsignedBigInteger('report_line_id')->nullable();
            $table->string('form_type');
            $table->string('field')->nullable();
            $table->decimal('calculated_value', 18, 2)->nullable();
            $table->decimal('adjusted_value', 18, 2)->nullable();
            $table->text('reason');
            $table->string('supporting_document')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('naicom_adjustments');
    }
};
