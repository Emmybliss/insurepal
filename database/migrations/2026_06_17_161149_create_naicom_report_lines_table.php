<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('naicom_report_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_run_id')->constrained('naicom_report_runs')->onDelete('cascade');
            $table->string('form_type');
            $table->integer('row_number');
            $table->tinyInteger('month')->nullable();
            $table->json('data');
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->decimal('calculated_amount', 18, 2)->nullable();
            $table->decimal('adjusted_amount', 18, 2)->nullable();
            $table->unsignedBigInteger('adjustment_id')->nullable();
            $table->timestamps();

            $table->index(['report_run_id', 'form_type', 'row_number']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('naicom_report_lines');
    }
};
