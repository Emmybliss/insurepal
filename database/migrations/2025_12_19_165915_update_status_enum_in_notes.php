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

        DB::statement("ALTER TABLE debit_notes MODIFY COLUMN status ENUM('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void', 'generated') NOT NULL DEFAULT 'draft'");
        DB::statement("ALTER TABLE credit_notes MODIFY COLUMN status ENUM('draft', 'issued', 'paid', 'cancelled', 'void', 'generated') NOT NULL DEFAULT 'draft'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        // Update any 'generated' status to 'issued' before reverting the ENUM list
        DB::table('debit_notes')->where('status', 'generated')->update(['status' => 'issued']);
        DB::table('credit_notes')->where('status', 'generated')->update(['status' => 'issued']);

        DB::statement("ALTER TABLE debit_notes MODIFY COLUMN status ENUM('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void') NOT NULL DEFAULT 'draft'");
        DB::statement("ALTER TABLE credit_notes MODIFY COLUMN status ENUM('draft', 'issued', 'paid', 'cancelled', 'void') NOT NULL DEFAULT 'draft'");
    }
};
