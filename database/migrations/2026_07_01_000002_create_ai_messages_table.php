<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ai_messages')) {
            return;
        }

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
            $table->string('role');
            $table->text('content');
            $table->json('metadata')->nullable();
            $table->json('tool_calls')->nullable();
            $table->string('tool_execution_id')->nullable();
            $table->timestamps();

            $table->index('conversation_id');
        });
    }
};
