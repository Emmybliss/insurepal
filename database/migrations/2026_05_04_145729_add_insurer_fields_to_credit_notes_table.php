<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_notes', function (Blueprint $table) {
            $table->unsignedBigInteger('insurer_id')->nullable()->after('policy_id');
            $table->string('insurer_name')->nullable()->after('insurer_id');
            $table->string('insurer_email')->nullable()->after('insurer_name');
            $table->string('insurer_phone', 50)->nullable()->after('insurer_email');
            $table->text('insurer_address')->nullable()->after('insurer_phone');
            $table->string('insurer_source', 50)->nullable()->after('insurer_address');
        });
    }

    public function down(): void
    {
        Schema::table('credit_notes', function (Blueprint $table) {
            $table->dropColumn([
                'insurer_id',
                'insurer_name',
                'insurer_email',
                'insurer_phone',
                'insurer_address',
                'insurer_source',
            ]);
        });
    }
};
