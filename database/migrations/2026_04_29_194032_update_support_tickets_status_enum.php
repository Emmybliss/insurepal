<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * MODIFY COLUMN is MySQL-only syntax. Skip on SQLite (used for tests).
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE support_tickets MODIFY COLUMN status ENUM('new', 'open', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed') NOT NULL DEFAULT 'new'");
        DB::statement("ALTER TABLE support_tickets MODIFY COLUMN priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        // Revert any 'new', 'assigned', 'waiting_customer' status to 'open' before reverting the ENUM list
        DB::table('support_tickets')->whereIn('status', ['new', 'assigned', 'waiting_customer'])->update(['status' => 'open']);
        // Revert 'medium' to 'normal' (if 'normal' is what we want to go back to)
        DB::table('support_tickets')->where('priority', 'medium')->update(['priority' => 'normal']);

        DB::statement("ALTER TABLE support_tickets MODIFY COLUMN status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open'");
        DB::statement("ALTER TABLE support_tickets MODIFY COLUMN priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal'");
    }
};
