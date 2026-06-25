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
            $table->unsignedBigInteger('policy_class_id')->nullable()->after('policy_category_id');
            $table->foreign('policy_class_id')->references('id')->on('policy_classes')->onDelete('set null');
            $table->index(['policy_class_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            // Drop foreign key FIRST because the composite index might be needed for it
            $foreignKeys = Schema::getForeignKeys('policies');
            $fkExists = collect($foreignKeys)->contains(function ($fk) {
                return $fk['name'] === 'policies_policy_class_id_foreign';
            });

            if ($fkExists) {
                $table->dropForeign(['policy_class_id']);
            }

            // Drop composite index SECOND
            $indexes = Schema::getIndexes('policies');
            $indexExists = collect($indexes)->contains(function ($idx) {
                return $idx['name'] === 'policies_policy_class_id_status_index';
            });

            if ($indexExists) {
                $table->dropIndex(['policy_class_id', 'status']);
            }

            if (Schema::hasColumn('policies', 'policy_class_id')) {
                $table->dropColumn('policy_class_id');
            }
        });
    }
};
