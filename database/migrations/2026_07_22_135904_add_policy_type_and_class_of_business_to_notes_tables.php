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
        Schema::table('debit_notes', function (Blueprint $table) {
            $table->string('policy_type')->nullable()->after('transaction_type');
            $table->string('class_of_business')->nullable()->after('policy_type');
        });

        Schema::table('credit_notes', function (Blueprint $table) {
            $table->string('policy_type')->nullable()->after('transaction_type');
            $table->string('class_of_business')->nullable()->after('policy_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('debit_notes', function (Blueprint $table) {
            $table->dropColumn(['policy_type', 'class_of_business']);
        });

        Schema::table('credit_notes', function (Blueprint $table) {
            $table->dropColumn(['policy_type', 'class_of_business']);
        });
    }
};
