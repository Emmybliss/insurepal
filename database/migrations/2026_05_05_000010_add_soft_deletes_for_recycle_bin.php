<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (! Schema::hasColumn('customers', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('policies', function (Blueprint $table) {
            if (! Schema::hasColumn('policies', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('quotes', function (Blueprint $table) {
            if (! Schema::hasColumn('quotes', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('claims', function (Blueprint $table) {
            if (! Schema::hasColumn('claims', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('documents', function (Blueprint $table) {
            if (! Schema::hasColumn('documents', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('policies', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
