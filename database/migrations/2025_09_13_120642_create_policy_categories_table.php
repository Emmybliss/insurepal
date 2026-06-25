<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_type_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('form_fields')->nullable(); // Additional form fields specific to category
            $table->decimal('premium_adjustment', 15, 2)->default(0); // Adjustment to base premium
            $table->decimal('commission_adjustment', 5, 2)->default(0); // Adjustment to commission rate
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['policy_type_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_categories');
    }
};
