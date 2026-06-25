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
        Schema::create('policy_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->enum('stage', ['60_days', '30_days', '14_days', '7_days', 'daily', 'expiry_day']);
            $table->timestamp('sent_at');
            $table->timestamps();

            // Prevent duplicate notifications for the same stage per policy
            $table->unique(['policy_id', 'stage']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policy_notifications');
    }
};
