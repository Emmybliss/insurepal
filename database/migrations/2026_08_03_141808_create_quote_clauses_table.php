<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_clauses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->string('clause_type')->default('clause');
            $table->string('title');
            $table->text('content');
            $table->boolean('is_standard')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['quote_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_clauses');
    }
};
