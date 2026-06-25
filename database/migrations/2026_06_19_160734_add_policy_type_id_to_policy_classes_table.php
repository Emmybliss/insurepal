<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('policy_classes', 'policy_type_id')) {
            Schema::table('policy_classes', function (Blueprint $table) {
                $table->foreignId('policy_type_id')->nullable()->after('id')->constrained();
            });
        }

        // Data migration: populate policy_type_id from the category chain
        // and absorb premium_adjustment/commission_adjustment into multipliers
        DB::table('policy_classes')
            ->join('policy_categories', 'policy_classes.policy_category_id', '=', 'policy_categories.id')
            ->join('policy_types', 'policy_categories.policy_type_id', '=', 'policy_types.id')
            ->whereNull('policy_classes.policy_type_id')
            ->select([
                'policy_classes.id',
                'policy_types.id as type_id',
                'policy_types.base_premium',
                'policy_types.commission_rate',
                'policy_categories.premium_adjustment',
                'policy_categories.commission_adjustment',
                'policy_classes.premium_multiplier',
                'policy_classes.commission_multiplier',
            ])
            ->orderBy('policy_classes.id')
            ->each(function ($row) {
                $updates = ['policy_type_id' => $row->type_id];

                $basePremium = $row->base_premium;
                $adjustedPremium = $basePremium + $row->premium_adjustment;
                if ($basePremium > 0) {
                    $updates['premium_multiplier'] = round(
                        $row->premium_multiplier * ($adjustedPremium / $basePremium),
                        4
                    );
                }

                $baseCommission = $row->commission_rate;
                $adjustedCommission = $baseCommission + $row->commission_adjustment;
                if ($baseCommission > 0) {
                    $updates['commission_multiplier'] = round(
                        $row->commission_multiplier * ($adjustedCommission / $baseCommission),
                        4
                    );
                }

                DB::table('policy_classes')
                    ->where('id', $row->id)
                    ->update($updates);
            });

        Schema::table('policy_classes', function (Blueprint $table) {
            $table->unsignedBigInteger('policy_type_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('policy_classes', function (Blueprint $table) {
            $table->dropForeign(['policy_type_id']);
            $table->dropColumn('policy_type_id');
        });
    }
};
