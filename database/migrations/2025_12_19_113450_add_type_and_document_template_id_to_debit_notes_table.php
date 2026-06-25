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
        if (Schema::hasTable('debit_notes')) {
            Schema::table('debit_notes', function (Blueprint $table) {
                if (! Schema::hasColumn('debit_notes', 'type')) {
                    $table->string('type')->default('standard')->after('status');
                }
                if (! Schema::hasColumn('debit_notes', 'document_template_id')) {
                    $table->foreignId('document_template_id')->nullable()->constrained('document_templates')->nullOnDelete()->after('policy_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('debit_notes')) {
            Schema::table('debit_notes', function (Blueprint $table) {
                $foreignKeys = Schema::getForeignKeys('debit_notes');
                $fkExists = collect($foreignKeys)->contains(function ($fk) {
                    return $fk['name'] === 'debit_notes_document_template_id_foreign';
                });

                if ($fkExists) {
                    $table->dropForeign(['document_template_id']);
                }

                if (Schema::hasColumn('debit_notes', 'type')) {
                    $table->dropColumn('type');
                }

                if (Schema::hasColumn('debit_notes', 'document_template_id')) {
                    $table->dropColumn('document_template_id');
                }
            });
        }
    }
};
