<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('communication_typing_indicators');
    }

    public function down(): void
    {
        // Reversible only if needed
    }
};
