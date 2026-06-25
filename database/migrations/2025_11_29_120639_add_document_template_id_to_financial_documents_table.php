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
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained()->nullOnDelete();
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained()->nullOnDelete();
        });

        Schema::table('credit_notes', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained()->nullOnDelete();
        });

        Schema::table('debit_notes', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['invoices', 'receipts', 'credit_notes', 'debit_notes'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $foreignKeys = Schema::getForeignKeys($tableName);
                    $fkName = $tableName.'_document_template_id_foreign';

                    $fkExists = collect($foreignKeys)->contains(function ($fk) use ($fkName) {
                        return $fk['name'] === $fkName;
                    });

                    if ($fkExists) {
                        $table->dropForeign(['document_template_id']);
                    }

                    if (Schema::hasColumn($tableName, 'document_template_id')) {
                        $table->dropColumn('document_template_id');
                    }
                });
            }
        }
    }
};
