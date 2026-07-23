<?php

use App\Models\Policy;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->string('policy_number')->nullable()->change();
            if (! Schema::hasColumn('policies', 'internal_reference')) {
                $table->string('internal_reference')->nullable()->unique()->after('policy_number');
            }
        });

        // 1. Clean placeholder policy numbers
        $placeholders = ['tba', 'n/a', 'to be advised', 'pending', 't.b.a', 't.b.a.', 'n.a', 'n.a.'];
        DB::table('policies')
            ->whereIn(DB::raw('LOWER(TRIM(policy_number))'), $placeholders)
            ->update(['policy_number' => null]);

        // 2. Backfill internal_reference for existing policies that do not have one
        $policies = DB::table('policies')
            ->whereNull('internal_reference')
            ->orderBy('id', 'asc')
            ->get();

        $yearCounters = [];

        foreach ($policies as $policy) {
            $year = ! empty($policy->created_at) ? date('Y', strtotime($policy->created_at)) : date('Y');
            $prefix = 'IP-BRK';

            if (! isset($yearCounters[$year])) {
                // Find existing highest counter for this year
                $pattern = "{$prefix}-{$year}-%";
                $lastRef = DB::table('policies')
                    ->where('internal_reference', 'like', $pattern)
                    ->orderByRaw('LENGTH(internal_reference) DESC')
                    ->orderBy('internal_reference', 'desc')
                    ->value('internal_reference');

                $nextNum = 1;
                if ($lastRef && preg_match('/-(\d+)$/', $lastRef, $matches)) {
                    $nextNum = intval($matches[1]) + 1;
                }
                $yearCounters[$year] = $nextNum;
            }

            do {
                $candidate = sprintf('%s-%s-%06d', $prefix, $year, $yearCounters[$year]);
                $exists = DB::table('policies')->where('internal_reference', $candidate)->exists();
                $yearCounters[$year]++;
            } while ($exists);

            DB::table('policies')
                ->where('id', $policy->id)
                ->update(['internal_reference' => $candidate]);
        }
    }

    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            if (Schema::hasColumn('policies', 'internal_reference')) {
                $table->dropUnique(['internal_reference']);
                $table->dropColumn('internal_reference');
            }
        });
    }
};
