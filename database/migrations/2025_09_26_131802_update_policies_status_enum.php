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
        Schema::table('policies', function (Blueprint $table) {
            $table->enum('status', [
                'active',
                'expired',
                'cancelled',
                'suspended',
            ])->default('active')->change();
        });
    }
};
