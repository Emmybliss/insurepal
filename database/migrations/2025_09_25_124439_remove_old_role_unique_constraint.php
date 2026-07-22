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
        Schema::table('roles', function (Blueprint $table) {
            $table->dropUnique(['name', 'guard_name']);
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropUnique(['name', 'guard_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $rolesHasDuplicates = \Illuminate\Support\Facades\DB::table('roles')
            ->select('name', 'guard_name')
            ->groupBy('name', 'guard_name')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if (! $rolesHasDuplicates) {
            Schema::table('roles', function (Blueprint $table) {
                $table->unique(['name', 'guard_name']);
            });
        }

        $permissionsHasDuplicates = \Illuminate\Support\Facades\DB::table('permissions')
            ->select('name', 'guard_name')
            ->groupBy('name', 'guard_name')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if (! $permissionsHasDuplicates) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->unique(['name', 'guard_name']);
            });
        }
    }
};
