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
        Schema::create('tenant_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('requested_id')->constrained('tenants')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined', 'removed'])->default('pending');
            $table->enum('relationship_type', ['underwriter_broker', 'broker_underwriter'])->nullable();
            $table->text('request_message')->nullable();
            $table->text('decline_reason')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->timestamp('removed_at')->nullable();
            $table->foreignId('actioned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['requester_id', 'status']);
            $table->index(['requested_id', 'status']);
            $table->index(['requester_id', 'requested_id']);
            $table->index('status');
            $table->index('relationship_type');

            // Prevent duplicate relationships
            $table->unique(['requester_id', 'requested_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_relationships');
    }
};
