<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_templates')) {
            return;
        }

        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('subject');
            $table->text('body_html');
            $table->string('category')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'category']);
        });
    }
};
