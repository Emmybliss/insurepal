<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_template_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('template_key');
            $table->json('css_overrides')->nullable();
            $table->json('label_overrides')->nullable();
            $table->longText('custom_content')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'template_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_template_overrides');
    }
};
