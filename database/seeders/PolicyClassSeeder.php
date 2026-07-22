<?php

namespace Database\Seeders;

use App\Enums\RiskMode;
use App\Models\PolicyClass;
use App\Models\PolicyType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PolicyClassSeeder extends Seeder
{
    public function run(): void
    {
        $general = PolicyType::where('code', 'GENERAL')->first();
        $life = PolicyType::where('code', 'LIFE')->first();
        $health = PolicyType::where('code', 'HEALTH')->first();
        $takafulGeneral = PolicyType::where('code', 'TAKAFUL_GENERAL')->first();
        $takafulFamily = PolicyType::where('code', 'TAKAFUL_FAMILY')->first();

        $classes = [
            // General Insurance Classes
            [
                'policy_type_id' => $general->id,
                'name' => 'Motor',
                'description' => 'Motor insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 1,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Fire & Special Perils',
                'description' => 'Fire and special perils insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 2,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Marine',
                'description' => 'Marine insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 3,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Aviation',
                'description' => 'Aviation insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 4,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Engineering',
                'description' => 'Engineering insurance class',
                'risk_mode' => RiskMode::Scheduled->value,
                'sort_order' => 5,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Oil & Energy',
                'description' => 'Oil and energy insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 6,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Bond / Credit',
                'description' => 'Bond and credit insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 7,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Accident',
                'description' => 'Accident insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 8,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Agriculture',
                'description' => 'Agriculture insurance class',
                'risk_mode' => RiskMode::Scheduled->value,
                'sort_order' => 9,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Miscellaneous',
                'description' => 'Miscellaneous insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 10,
            ],
            [
                'policy_type_id' => $general->id,
                'name' => 'Various Policy',
                'description' => 'Various policy schedules',
                'risk_mode' => RiskMode::Mixed->value,
                'sort_order' => 11,
            ],

            // Life Insurance Classes
            [
                'policy_type_id' => $life->id,
                'name' => 'Individual Life',
                'description' => 'Individual life insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 1,
            ],
            [
                'policy_type_id' => $life->id,
                'name' => 'Group Life',
                'description' => 'Group life insurance class',
                'risk_mode' => RiskMode::Scheduled->value,
                'sort_order' => 2,
            ],
            [
                'policy_type_id' => $life->id,
                'name' => 'Annuity',
                'description' => 'Annuity class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 3,
            ],
            [
                'policy_type_id' => $life->id,
                'name' => 'Pension Related',
                'description' => 'Pension related insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 4,
            ],
            [
                'policy_type_id' => $life->id,
                'name' => 'Micro Insurance',
                'description' => 'Micro insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 5,
            ],

            // Health Insurance Classes
            [
                'policy_type_id' => $health->id,
                'name' => 'Individual Health',
                'description' => 'Individual health insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 1,
            ],
            [
                'policy_type_id' => $health->id,
                'name' => 'Group Health',
                'description' => 'Group health insurance class',
                'risk_mode' => RiskMode::Scheduled->value,
                'sort_order' => 2,
            ],
            [
                'policy_type_id' => $health->id,
                'name' => 'International Health',
                'description' => 'International health insurance class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 3,
            ],

            // Takaful General Classes
            [
                'policy_type_id' => $takafulGeneral->id,
                'name' => 'Motor Takaful',
                'description' => 'Motor Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 1,
            ],
            [
                'policy_type_id' => $takafulGeneral->id,
                'name' => 'Fire & Property Takaful',
                'description' => 'Fire and property Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 2,
            ],
            [
                'policy_type_id' => $takafulGeneral->id,
                'name' => 'Marine Takaful',
                'description' => 'Marine Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 3,
            ],
            [
                'policy_type_id' => $takafulGeneral->id,
                'name' => 'Engineering Takaful',
                'description' => 'Engineering Takaful class',
                'risk_mode' => RiskMode::Scheduled->value,
                'sort_order' => 4,
            ],
            [
                'policy_type_id' => $takafulGeneral->id,
                'name' => 'Accident & Liability Takaful',
                'description' => 'Accident and liability Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 5,
            ],
            [
                'policy_type_id' => $takafulGeneral->id,
                'name' => 'Agriculture Takaful',
                'description' => 'Agriculture Takaful class',
                'risk_mode' => RiskMode::Scheduled->value,
                'sort_order' => 6,
            ],
            [
                'policy_type_id' => $takafulGeneral->id,
                'name' => 'Miscellaneous Takaful',
                'description' => 'Miscellaneous Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 7,
            ],

            // Takaful Family Classes
            [
                'policy_type_id' => $takafulFamily->id,
                'name' => 'Individual Family Takaful',
                'description' => 'Individual family Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 1,
            ],
            [
                'policy_type_id' => $takafulFamily->id,
                'name' => 'Group Family Takaful',
                'description' => 'Group family Takaful class',
                'risk_mode' => RiskMode::Scheduled->value,
                'sort_order' => 2,
            ],
            [
                'policy_type_id' => $takafulFamily->id,
                'name' => 'Retirement & Pension Takaful',
                'description' => 'Retirement and pension Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 3,
            ],
            [
                'policy_type_id' => $takafulFamily->id,
                'name' => 'Children\'s Education Takaful',
                'description' => 'Children\'s education Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 4,
            ],
            [
                'policy_type_id' => $takafulFamily->id,
                'name' => 'Micro Takaful',
                'description' => 'Micro Takaful class',
                'risk_mode' => RiskMode::Single->value,
                'sort_order' => 5,
            ],
        ];

        foreach ($classes as $class) {
            $class['code'] = strtoupper(Str::slug($class['name'], '_'));
            $class['is_active'] = true;
            $class['premium_multiplier'] = 1.0;
            $class['commission_multiplier'] = 1.0;
            $class['min_coverage_period'] = 1;
            $class['max_coverage_period'] = 3650;

            PolicyClass::updateOrCreate(
                ['code' => $class['code']],
                $class
            );
        }

        $this->command->info('Policy classes seeded successfully!');
    }
}
