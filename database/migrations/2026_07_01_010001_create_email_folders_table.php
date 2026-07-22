<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_folders')) {
            return;
        }

        Schema::create('email_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('email_accounts')->cascadeOnDelete();
            $table->string('name');
            $table->string('remote_id')->nullable();
            $table->string('type');
            $table->foreignId('parent_id')->nullable()->constrained('email_folders')->nullOnDelete();
            $table->timestamps();

            $table->index(['account_id', 'type']);
        });
    }
};
