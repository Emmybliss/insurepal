<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a logo field to the customers table.
     * This stores the official business/company logo for corporate customers.
     * Individual customers do not use this field; their profile image lives on users.avatar.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('logo')->nullable()->after('company_name');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('logo');
        });
    }
};
