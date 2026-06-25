<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('subject');
            $table->text('body');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->string('sender_type')->default('user'); // user, system
            $table->json('recipients'); // Array of recipient IDs and types
            $table->json('attachments')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'sender_id']);
            $table->index('sent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
