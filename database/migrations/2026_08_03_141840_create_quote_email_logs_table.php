<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->string('sent_to');
            $table->string('subject');
            $table->text('body')->nullable();
            $table->foreignId('sent_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->index(['quote_id', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_email_logs');
    }
};
