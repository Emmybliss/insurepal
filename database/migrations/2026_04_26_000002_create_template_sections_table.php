<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('section_type');
            $table->longText('body_html')->nullable();
            $table->json('body_css')->nullable();
            $table->json('placeholder_definitions')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'section_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_sections');
    }
};
