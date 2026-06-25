<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $this->dropColumnOnSqlite();
        } else {
            Schema::table('support_tickets', function (Blueprint $table) {
                $table->dropForeign(['conversation_id']);
                $table->dropColumn('conversation_id');
            });
        }
    }

    protected function dropColumnOnSqlite(): void
    {
        $tempTable = 'support_tickets_temp';

        Schema::create($tempTable, function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('ticket_number')->unique();
            $table->string('subject');
            $table->text('description');
            $table->string('status')->default('new');
            $table->string('priority')->default('medium');
            $table->string('category')->default('general');
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'assignee_id']);
        });

        DB::statement('INSERT INTO '.$tempTable.' (id, tenant_id, ticket_number, subject, description, status, priority, category, requester_id, assignee_id, resolved_at, closed_at, created_at, updated_at) SELECT id, tenant_id, ticket_number, subject, description, status, priority, category, requester_id, assignee_id, resolved_at, closed_at, created_at, updated_at FROM support_tickets');

        Schema::drop('support_tickets');

        Schema::rename($tempTable, 'support_tickets');
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->foreignId('conversation_id')->nullable()->constrained()->nullOnDelete();
        });
    }
};
