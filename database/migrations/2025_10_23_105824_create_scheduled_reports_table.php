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
        Schema::create('scheduled_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('report_type');
            $table->string('frequency'); // daily, weekly, monthly, quarterly
            $table->json('recipients'); // email addresses
            $table->json('filters')->nullable(); // report filters
            $table->string('format')->default('pdf'); // pdf, excel, both
            $table->boolean('is_active')->default(true);
            $table->timestamp('next_run_at');
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('last_successful_run_at')->nullable();
            $table->text('last_error')->nullable();
            $table->integer('consecutive_failures')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active', 'next_run_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_reports');
    }
};
