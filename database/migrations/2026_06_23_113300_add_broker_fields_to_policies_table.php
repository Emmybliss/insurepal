<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->string('source_type', 50)->default('DIRECT_ISSUANCE')->after('policy_number');
            $table->foreignId('issued_by_id')->nullable()->constrained('users')->nullOnDelete()->after('insurer_id');
            $table->foreignId('broker_id')->nullable()->constrained('tenants')->nullOnDelete()->after('issued_by_id');
            $table->string('broker_slip_number', 100)->nullable()->after('broker_id');
            $table->date('placement_date')->nullable()->after('broker_slip_number');
            $table->boolean('is_policy_issued')->default(true)->after('placement_date');
            $table->string('schedule_file_path')->nullable()->after('is_policy_issued');
            $table->string('broker_slip_file_path')->nullable()->after('schedule_file_path');

            $table->index('source_type');
            $table->index('broker_id');
        });
    }

    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropIndex(['source_type']);
            $table->dropIndex(['broker_id']);
            $table->dropColumn([
                'source_type',
                'issued_by_id',
                'broker_id',
                'broker_slip_number',
                'placement_date',
                'is_policy_issued',
                'schedule_file_path',
                'broker_slip_file_path',
            ]);
        });
    }
};
