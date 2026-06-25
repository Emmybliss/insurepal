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
        Schema::table('document_templates', function (Blueprint $table) {
            $table->index(['tenant_id', 'deleted_at', 'created_at'], 'idx_tenant_deleted_created');
            $table->index(['tenant_id', 'type', 'is_default'], 'idx_tenant_type_default');
            $table->index(['tenant_id', 'is_active'], 'idx_tenant_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropIndex('idx_tenant_deleted_created');
            $table->dropIndex('idx_tenant_type_default');
            $table->dropIndex('idx_tenant_active');
        });
    }
};
