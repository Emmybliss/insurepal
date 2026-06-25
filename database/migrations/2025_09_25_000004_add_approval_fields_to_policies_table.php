<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->enum('approval_status', [
                'not_required',
                'pending',
                'approved',
                'rejected',
            ])->default('not_required')->after('status');

            $table->text('internal_notes')->nullable()->after('notes');
            $table->unsignedBigInteger('approved_by')->nullable()->after('created_by');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->timestamp('issued_at')->nullable()->after('approved_at');

            // Add foreign key for approved_by
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');

            // Add indexes
            $table->index(['tenant_id', 'approval_status']);
            $table->index('approved_at');
            $table->index('issued_at');
        });
    }

    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropIndex(['tenant_id', 'approval_status']);
            $table->dropIndex(['approved_at']);
            $table->dropIndex(['issued_at']);

            $table->dropColumn([
                'approval_status',
                'internal_notes',
                'approved_by',
                'approved_at',
                'issued_at',
            ]);
        });
    }
};
