<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_signatures')) {
            return;
        }

        Schema::create('email_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('email_accounts')->cascadeOnDelete();
            $table->string('name');
            $table->text('body_html');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }
};
