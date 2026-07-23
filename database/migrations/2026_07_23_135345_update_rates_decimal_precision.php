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
        if (Schema::hasColumn('policies', 'commission_rate')) {
            Schema::table('policies', function (Blueprint $table) {
                $table->decimal('commission_rate', 15, 6)->nullable()->change();
            });
        }

        if (Schema::hasColumn('policy_products', 'commission_rate')) {
            Schema::table('policy_products', function (Blueprint $table) {
                $table->decimal('commission_rate', 15, 6)->nullable()->change();
            });
        }

        if (Schema::hasColumn('policy_types', 'commission_rate')) {
            Schema::table('policy_types', function (Blueprint $table) {
                $table->decimal('commission_rate', 15, 6)->nullable()->change();
            });
        }

        if (Schema::hasTable('broker_slips')) {
            Schema::table('broker_slips', function (Blueprint $table) {
                if (Schema::hasColumn('broker_slips', 'commission_rate')) {
                    $table->decimal('commission_rate', 15, 6)->nullable()->change();
                }
                if (Schema::hasColumn('broker_slips', 'tax_rate')) {
                    $table->decimal('tax_rate', 15, 6)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('broker_slip_risks')) {
            Schema::table('broker_slip_risks', function (Blueprint $table) {
                if (Schema::hasColumn('broker_slip_risks', 'rate')) {
                    $table->decimal('rate', 15, 6)->nullable()->change();
                }
                if (Schema::hasColumn('broker_slip_risks', 'commission_rate')) {
                    $table->decimal('commission_rate', 15, 6)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('credit_notes')) {
            Schema::table('credit_notes', function (Blueprint $table) {
                if (Schema::hasColumn('credit_notes', 'commission_rate')) {
                    $table->decimal('commission_rate', 15, 6)->nullable()->change();
                }
                if (Schema::hasColumn('credit_notes', 'tax_rate')) {
                    $table->decimal('tax_rate', 15, 6)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('debit_notes')) {
            Schema::table('debit_notes', function (Blueprint $table) {
                if (Schema::hasColumn('debit_notes', 'tax_rate')) {
                    $table->decimal('tax_rate', 15, 6)->nullable()->change();
                }
                if (Schema::hasColumn('debit_notes', 'commission_rate')) {
                    $table->decimal('commission_rate', 15, 6)->nullable()->change();
                }
            });
        }

        if (Schema::hasTable('policy_risks')) {
            Schema::table('policy_risks', function (Blueprint $table) {
                if (Schema::hasColumn('policy_risks', 'rate')) {
                    $table->decimal('rate', 15, 6)->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op for column precision reduction to prevent data loss
    }
};
