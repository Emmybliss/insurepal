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
        Schema::create('sync_changes', function (Blueprint $table) {
            $table->id('cursor'); // Auto-incrementing monotonic sequence cursor
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('entity_type', 64);
            $table->unsignedBigInteger('entity_id');
            $table->string('client_uuid', 36)->nullable();
            $table->enum('action', ['create', 'update', 'delete']);
            $table->json('payload');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'cursor'], 'idx_sync_tenant_cursor');
            $table->index(['tenant_id', 'entity_type', 'entity_id'], 'idx_sync_entity');
        });

        Schema::create('sync_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('device_id', 64)->unique();
            $table->string('device_name', 255);
            $table->string('platform', 32)->default('desktop');
            $table->unsignedBigInteger('last_sync_cursor')->default(0);
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'user_id']);
        });

        Schema::create('sync_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('operation_id', 64)->unique();
            $table->string('idempotency_key', 128)->unique();
            $table->string('device_id', 64);
            $table->string('entity_type', 64);
            $table->string('entity_id', 64);
            $table->string('action', 32);
            $table->string('status', 32)->default('completed'); // completed, conflict, failed
            $table->json('response_payload')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'device_id']);
        });

        Schema::create('sync_conflicts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('operation_id', 64);
            $table->string('entity_type', 64);
            $table->string('entity_id', 64);
            $table->json('client_payload');
            $table->json('server_payload');
            $table->string('resolution_strategy', 64)->default('server_wins'); // server_wins, client_wins, merged, manual
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'entity_type', 'entity_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_conflicts');
        Schema::dropIfExists('sync_operations');
        Schema::dropIfExists('sync_devices');
        Schema::dropIfExists('sync_changes');
    }
};
