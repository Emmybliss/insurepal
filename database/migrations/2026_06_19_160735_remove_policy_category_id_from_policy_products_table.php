<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('policy_products', 'policy_category_id')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            Schema::disableForeignKeyConstraints();

            DB::statement('CREATE TABLE __policy_products_tmp AS SELECT * FROM policy_products');
            Schema::drop('policy_products');

            Schema::create('policy_products', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
                $table->foreignId('policy_type_id')->constrained()->onDelete('cascade');
                $table->foreignId('policy_class_id')->constrained()->onDelete('cascade');
                $table->string('name');
                $table->string('code')->unique();
                $table->decimal('base_premium', 12, 2)->default(0);
                $table->decimal('commission_rate', 5, 2)->default(0);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->boolean('requires_underwriting')->default(false);
                $table->boolean('requires_medical_exam')->default(false);
                $table->string('currency', 3)->default('NGN');
                $table->string('payment_frequency')->nullable();
                $table->json('form_fields')->nullable();
                $table->json('default_values')->nullable();
                $table->json('premium_factors')->nullable();
                $table->json('coverage_details')->nullable();
                $table->json('terms_conditions')->nullable();
                $table->json('exclusions')->nullable();
                $table->json('required_documents')->nullable();
                $table->integer('default_coverage_period')->default(365);
                $table->decimal('min_sum_assured', 15, 2)->default(0);
                $table->decimal('max_sum_assured', 15, 2)->nullable();
                $table->timestamps();
            });

            $columns = implode(', ', array_map(fn ($col) => '"'.$col.'"', [
                'id', 'tenant_id', 'policy_type_id', 'policy_class_id',
                'name', 'code', 'base_premium', 'commission_rate',
                'description', 'is_active', 'sort_order',
                'requires_underwriting', 'requires_medical_exam', 'currency',
                'payment_frequency', 'form_fields', 'default_values',
                'premium_factors', 'coverage_details', 'terms_conditions',
                'exclusions', 'required_documents', 'default_coverage_period',
                'min_sum_assured', 'max_sum_assured', 'created_at', 'updated_at',
            ]));

            DB::statement("INSERT INTO policy_products ({$columns}) SELECT {$columns} FROM __policy_products_tmp");
            Schema::drop('__policy_products_tmp');

            Schema::enableForeignKeyConstraints();

            return;
        }

        // Drop FKs that use policy_hierarchy_index so the index can be removed
        $fkType = DB::selectOne("
            SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'policy_products' AND COLUMN_NAME = 'policy_type_id' AND REFERENCED_TABLE_NAME IS NOT NULL
        ");
        if ($fkType) {
            Schema::table('policy_products', function (Blueprint $table) use ($fkType) {
                $table->dropForeign($fkType->CONSTRAINT_NAME);
            });
        }

        $fkClass = DB::selectOne("
            SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'policy_products' AND COLUMN_NAME = 'policy_class_id' AND REFERENCED_TABLE_NAME IS NOT NULL
        ");
        if ($fkClass && $fkClass->CONSTRAINT_NAME !== ($fkType->CONSTRAINT_NAME ?? null)) {
            Schema::table('policy_products', function (Blueprint $table) use ($fkClass) {
                $table->dropForeign($fkClass->CONSTRAINT_NAME);
            });
        }

        Schema::table('policy_products', function (Blueprint $table) {
            $table->dropIndex('policy_hierarchy_index');
            $table->dropColumn('policy_category_id');
        });

        // Recreate FKs (auto-create their own indexes)
        Schema::table('policy_products', function (Blueprint $table) use ($fkType, $fkClass) {
            if ($fkType) {
                $table->foreign('policy_type_id')->references('id')->on('policy_types')->onDelete('cascade');
            }
            if ($fkClass) {
                $table->foreign('policy_class_id')->references('id')->on('policy_classes')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('policy_products', function (Blueprint $table) {
            $table->foreignId('policy_category_id')->nullable()->after('policy_type_id')->constrained()->onDelete('cascade');
            $table->index(['policy_type_id', 'policy_category_id', 'policy_class_id'], 'policy_hierarchy_index');
        });
    }
};
