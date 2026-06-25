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
        Schema::create('tenant_api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('token'); // Encrypted
            $table->string('public_key')->unique(); // Public ID for Widgets
            $table->string('last_4_chars', 4); // For display
            $table->json('scopes')->nullable(); // e.g. ['policies:read', 'policies:write']
            $table->json('allowed_domains')->nullable(); // For CORS / Widget validation
            $table->timestamp('last_used_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_api_keys');
    }
};
