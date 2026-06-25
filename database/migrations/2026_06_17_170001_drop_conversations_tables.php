<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('typing_indicators');
        Schema::dropIfExists('conversation_messages');
        Schema::dropIfExists('conversations');
    }

    public function down(): void
    {
        // Reversible only if needed - old tables are not recreated
    }
};
