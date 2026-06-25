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
            // Drop the existing foreign key
            $table->dropForeign(['insurance_product_id']);

            // Rename the column
            $table->renameColumn('insurance_product_id', 'policy_product_id');
        });

        // Add the new foreign key constraint in a separate statement
        Schema::table('policies', function (Blueprint $table) {
            $table->foreign('policy_product_id')->references('id')->on('policy_products')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();

        if (Schema::hasTable('policies')) {
            Schema::table('policies', function (Blueprint $table) {
                $foreignKeys = Schema::getForeignKeys('policies');
                $fkExists = collect($foreignKeys)->contains(function ($fk) {
                    return $fk['name'] === 'policies_policy_product_id_foreign';
                });

                if ($fkExists) {
                    $table->dropForeign(['policy_product_id']);
                }

                if (Schema::hasColumn('policies', 'policy_product_id')) {
                    $table->renameColumn('policy_product_id', 'insurance_product_id');
                }
            });

            // Add the old foreign key constraint back
            Schema::table('policies', function (Blueprint $table) {
                if (Schema::hasColumn('policies', 'insurance_product_id')) {
                    $table->foreign('insurance_product_id')->references('id')->on('insurance_products')->onDelete('restrict');
                }
            });
        }

        Schema::enableForeignKeyConstraints();
    }
};
