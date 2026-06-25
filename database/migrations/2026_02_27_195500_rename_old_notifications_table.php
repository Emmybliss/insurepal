<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('notifications') && ! Schema::hasTable('app_notifications')) {
            Schema::rename('notifications', 'app_notifications');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('app_notifications') && ! Schema::hasTable('notifications')) {
            Schema::rename('app_notifications', 'notifications');
        }
    }
};
