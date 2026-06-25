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
        Schema::table('quotes', function (Blueprint $table) {
            $table->text('internal_notes')->nullable()->after('notes');
            $table->timestamp('sent_at')->nullable()->after('created_by');
            $table->timestamp('accepted_at')->nullable()->after('sent_at');
            $table->timestamp('rejected_at')->nullable()->after('accepted_at');
            $table->timestamp('expired_at')->nullable()->after('rejected_at');
            $table->softDeletes();

            // Add indexes for better performance
            $table->index(['tenant_id', 'valid_until']);
            $table->index(['created_by']);
            $table->index(['sent_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('quotes')) {
            // Drop columns
            try {
                Schema::table('quotes', function (Blueprint $table) {
                    $columns = ['internal_notes', 'sent_at', 'accepted_at', 'rejected_at', 'expired_at'];
                    foreach ($columns as $column) {
                        if (Schema::hasColumn('quotes', $column)) {
                            $table->dropColumn($column);
                        }
                    }
                });
            } catch (\Exception $e) {
            }

            // Drop soft deletes
            try {
                if (Schema::hasColumn('quotes', 'deleted_at')) {
                    Schema::table('quotes', function (Blueprint $table) {
                        $table->dropSoftDeletes();
                    });
                }
            } catch (\Exception $e) {
            }

            // Drop indexes individually
            $indexes = [
                ['tenant_id', 'valid_until'],
                ['created_by'],
                ['sent_at'],
            ];

            foreach ($indexes as $indexColumns) {
                try {
                    Schema::table('quotes', function (Blueprint $table) use ($indexColumns) {
                        $table->dropIndex($indexColumns);
                    });
                } catch (\Exception $e) {
                    // Ignore if already dropped or needed by FK
                }
            }
        }
    }
};
