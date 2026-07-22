<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE policies MODIFY COLUMN status ENUM('draft','pending_approval','approved','active','expired','cancelled','suspended','rejected','recorded') NOT NULL DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE policies MODIFY COLUMN status ENUM('draft','pending_approval','approved','active','expired','cancelled','suspended','rejected') NOT NULL DEFAULT 'draft'");
        }
    }
};
