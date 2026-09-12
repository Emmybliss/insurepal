<?php

use App\Models\Tenant;
use App\Rules\Subdomain;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('tenants', 'subdomain')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('subdomain')->nullable()->unique()->index()->after('slug');
            });
        }

        // Backfill existing tenants safely
        $tenants = Tenant::whereNull('subdomain')->orWhere('subdomain', '')->get();
        $usedSubdomains = Tenant::whereNotNull('subdomain')
            ->where('subdomain', '!=', '')
            ->pluck('subdomain')
            ->toArray();

        foreach ($tenants as $tenant) {
            $baseSource = ! empty($tenant->slug) ? $tenant->slug : $tenant->name;
            $candidate = Str::slug($baseSource);
            $candidate = preg_replace('/[^a-z0-9\-]/', '', strtolower($candidate));

            if (empty($candidate)) {
                $candidate = 'tenant-'.$tenant->id;
            }

            // Check if candidate is reserved or already used
            $finalSubdomain = $candidate;
            $counter = 1;

            while (in_array($finalSubdomain, Subdomain::RESERVED, true) || in_array($finalSubdomain, $usedSubdomains, true)) {
                $finalSubdomain = "{$candidate}-{$counter}";
                $counter++;
            }

            $tenant->update(['subdomain' => $finalSubdomain]);
            $usedSubdomains[] = $finalSubdomain;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('tenants', 'subdomain')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->dropColumn('subdomain');
            });
        }
    }
};
