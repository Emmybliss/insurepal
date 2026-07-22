<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->enum('status', [
                'draft',
                'pending_approval',
                'approved',
                'active',
                'expired',
                'cancelled',
                'suspended',
                'rejected',
            ])->default('draft')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        // Remap values that don't exist in the legacy enum before shrinking.
        DB::table('policies')->whereIn('status', ['draft', 'pending_approval', 'approved'])->update(['status' => 'active']);
        DB::table('policies')->where('status', 'rejected')->update(['status' => 'cancelled']);

        DB::statement("ALTER TABLE policies MODIFY COLUMN status ENUM('active', 'expired', 'cancelled', 'suspended') NOT NULL DEFAULT 'active'");
    }
};

