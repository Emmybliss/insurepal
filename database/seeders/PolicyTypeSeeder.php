<?php

namespace Database\Seeders;

use App\Models\PolicyType;
use Illuminate\Database\Seeder;

class PolicyTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $policyTypes = [
            [
                'name' => 'General Insurance',
                'code' => 'GENERAL',
                'description' => 'Non-life insurance policies such as motor, fire, and marine.',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Life Insurance',
                'code' => 'LIFE',
                'description' => 'Insurance coverage for life and health-related risks.',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Health Insurance',
                'code' => 'HEALTH',
                'description' => 'Insurance coverage for medical expenses and health care.',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Takaful General',
                'code' => 'TAKAFUL_GENERAL',
                'description' => 'Islamic insurance for general non-life risks.',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Takaful Family',
                'code' => 'TAKAFUL_FAMILY',
                'description' => 'Islamic insurance for family and life-related risks.',
                'is_active' => true,
                'sort_order' => 5,
            ],
        ];

        foreach ($policyTypes as $policyType) {
            PolicyType::updateOrCreate(
                ['code' => $policyType['code']],
                $policyType
            );
        }

        $this->command->info('Policy types seeded successfully!');
    }
}
