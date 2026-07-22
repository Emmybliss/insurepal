<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_attachments')) {
            return;
        }

        Schema::create('email_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('email_messages')->cascadeOnDelete();
            $table->string('filename');
            $table->string('mime_type');
            $table->unsignedBigInteger('size_bytes');
            $table->string('storage_path')->nullable();
            $table->string('content_id')->nullable();
            $table->timestamps();
        });
    }
};
