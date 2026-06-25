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
        Schema::create('claim_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained()->onDelete('cascade');
            $table->foreignId('author_id')->constrained('users')->onDelete('restrict');
            $table->text('body');
            $table->json('attachments')->nullable();
            $table->boolean('is_internal')->default(false)->comment('Internal comments visible to reviewers only');
            $table->foreignId('parent_id')->nullable()->constrained('claim_comments')->onDelete('cascade');
            $table->timestamps();

            // Indexes
            $table->index('claim_id');
            $table->index('author_id');
            $table->index('parent_id');
            $table->index(['claim_id', 'is_internal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_comments');
    }
};
