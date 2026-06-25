<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('policy_type_id')->constrained()->onDelete('cascade');
            $table->foreignId('policy_category_id')->constrained()->onDelete('cascade');
            $table->foreignId('policy_class_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('form_fields')->nullable(); // Merged form fields from type, category, class
            $table->json('default_values')->nullable(); // Default values for form fields
            $table->decimal('base_premium', 15, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->json('premium_factors')->nullable(); // Additional factors affecting premium
            $table->json('coverage_details')->nullable(); // Coverage specifications
            $table->json('terms_conditions')->nullable(); // Policy terms and conditions
            $table->json('exclusions')->nullable(); // Policy exclusions
            $table->integer('default_coverage_period')->default(365); // Days
            $table->decimal('min_sum_assured', 15, 2)->default(0);
            $table->decimal('max_sum_assured', 15, 2)->nullable();
            $table->boolean('requires_underwriting')->default(false);
            $table->boolean('requires_medical_exam')->default(false);
            $table->json('required_documents')->nullable(); // List of required documents
            $table->string('currency', 3)->default('NGN');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['policy_type_id', 'policy_category_id', 'policy_class_id'], 'policy_hierarchy_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_products');
    }
};
