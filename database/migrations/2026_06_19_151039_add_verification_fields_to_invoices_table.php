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
            $table->string('verification_token', 64)->unique()->nullable()->after('id');
            $table->string('document_hash', 64)->nullable()->after('file_path');
            $table->json('snapshot_json')->nullable()->after('document_hash');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['verification_token', 'document_hash', 'snapshot_json']);
        });
    }
};
