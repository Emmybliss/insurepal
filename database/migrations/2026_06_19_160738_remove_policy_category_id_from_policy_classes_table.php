<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('policy_classes', 'policy_category_id')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            Schema::disableForeignKeyConstraints();

            DB::statement('CREATE TABLE __policy_classes_tmp AS SELECT * FROM policy_classes');
            Schema::drop('policy_classes');

            Schema::create('policy_classes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('policy_type_id')->constrained()->onDelete('cascade');
                $table->string('name');
                $table->string('code')->unique();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->decimal('premium_multiplier', 5, 2)->default(1.00);
                $table->decimal('commission_multiplier', 5, 2)->default(1.00);
                $table->timestamps();
            });

            $columns = implode(', ', array_map(fn ($col) => '"'.$col.'"', [
                'id', 'policy_type_id', 'name', 'code', 'description',
                'is_active', 'sort_order', 'premium_multiplier',
                'commission_multiplier', 'created_at', 'updated_at',
            ]));

            DB::statement("INSERT INTO policy_classes ({$columns}) SELECT {$columns} FROM __policy_classes_tmp");
            Schema::drop('__policy_classes_tmp');

            Schema::enableForeignKeyConstraints();

            return;
        }

        Schema::table('policy_classes', function (Blueprint $table) {
            $table->dropForeign(['policy_category_id']);
            $table->dropIndex(['policy_category_id', 'is_active']);
            $table->dropColumn('policy_category_id');
        });
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('policy_classes', function (Blueprint $table) {
            $table->foreignId('policy_category_id')->nullable()->after('policy_type_id')->constrained()->onDelete('cascade');
            $table->index(['policy_category_id', 'is_active']);
        });
    }
};
