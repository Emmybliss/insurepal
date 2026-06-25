<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_category_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('form_fields')->nullable(); // Additional form fields specific to class
            $table->decimal('premium_multiplier', 8, 4)->default(1.0000); // Multiplier for premium calculation
            $table->decimal('commission_multiplier', 8, 4)->default(1.0000); // Multiplier for commission
            $table->json('risk_factors')->nullable(); // Risk assessment factors
            $table->integer('min_coverage_period')->default(30); // Days
            $table->integer('max_coverage_period')->default(365); // Days
            $table->decimal('min_sum_assured', 15, 2)->default(0);
            $table->decimal('max_sum_assured', 15, 2)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['policy_category_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_classes');
    }
};
