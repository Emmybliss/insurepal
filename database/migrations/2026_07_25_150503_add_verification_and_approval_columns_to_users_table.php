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
        Schema::table('users', function (Blueprint $table) {
            $table->string('status')->default('pending_verification')->after('is_active');
            $table->string('approval_method')->nullable()->after('status');
            $table->foreignId('approved_by')->nullable()->after('approval_method')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->timestamp('last_verification_sent_at')->nullable()->after('email_verified_at');
        });

        // Populate existing users: set status to active if email is already verified
        \Illuminate\Support\Facades\DB::table('users')
            ->whereNotNull('email_verified_at')
            ->update([
                'status' => 'active',
                'approval_method' => 'email',
                'approved_at' => \Illuminate\Support\Facades\DB::raw('email_verified_at'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'status',
                'approval_method',
                'approved_by',
                'approved_at',
                'last_verification_sent_at',
            ]);
        });
    }
};
