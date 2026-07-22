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
        Schema::table('credit_notes', function (Blueprint $table) {
            $table->string('transaction_type')->nullable()->after('type');
            $table->decimal('tax_rate', 8, 4)->default(0)->after('tax_amount');
            $table->decimal('commission_amount', 12, 2)->default(0)->after('total_amount');
            $table->decimal('commission_rate', 8, 4)->default(0)->after('commission_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('credit_notes', function (Blueprint $table) {
            $table->dropColumn(['transaction_type', 'tax_rate', 'commission_amount', 'commission_rate']);
        });
    }
};
