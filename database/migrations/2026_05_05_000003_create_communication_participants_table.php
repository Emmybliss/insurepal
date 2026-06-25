<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('communication_thread_id')->constrained('communication_threads')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['sender', 'recipient', 'cc', 'bcc', 'participant', 'assignee'])->default('participant');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('last_read_at')->nullable();
            $table->timestamp('muted_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->unique(['communication_thread_id', 'user_id'], 'thread_user_unique');
            $table->index(['user_id', 'communication_thread_id'], 'user_thread_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_participants');
    }
};
