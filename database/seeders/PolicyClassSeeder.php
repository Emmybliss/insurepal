<?php

namespace Database\Seeders;

use App\Models\PolicyClass;
use App\Models\PolicyType;
use Illuminate\Database\Seeder;

class PolicyClassSeeder extends Seeder
{
    public function run(): void
    {
        $motor = PolicyType::where('name', 'Motor Insurance')->first();
        $life = PolicyType::where('name', 'Life Insurance')->first();
        $property = PolicyType::where('name', 'Property Insurance')->first();

        $classes = [
            // Motor Classes
            [
                'policy_type_id' => $motor->id,
                'name' => 'Comprehensive Cover',
                'code' => 'COMPREHENSIVE_COVER',
                'description' => 'Full coverage including third party, fire, theft, and own damage',
                'is_active' => true,
                'premium_multiplier' => 1.0,
                'sort_order' => 1,
                'form_fields' => [
                    ['name' => 'excess_amount', 'type' => 'select', 'label' => 'Excess Amount', 'options' => [['label' => '₦50,000', 'value' => '50000'], ['label' => '₦100,000', 'value' => '100000'], ['label' => '₦200,000', 'value' => '200000']], 'required' => true, 'validation' => 'required'],
                ],
            ],
            [
                'policy_type_id' => $motor->id,
                'name' => 'Third Party Only',
                'code' => 'THIRD_PARTY_ONLY',
                'description' => 'Basic coverage for third party liabilities only',
                'is_active' => true,
                'premium_multiplier' => 0.3,
                'sort_order' => 2,
                'form_fields' => [],
            ],
            [
                'policy_type_id' => $motor->id,
                'name' => 'Third Party Fire & Theft',
                'code' => 'THIRD_PARTY_FIRE_THEFT',
                'description' => 'Third party coverage plus fire and theft protection',
                'is_active' => true,
                'premium_multiplier' => 0.5,
                'sort_order' => 3,
                'form_fields' => [],
            ],
            [
                'policy_type_id' => $motor->id,
                'name' => 'Commercial Comprehensive',
                'code' => 'COMMERCIAL_COMPREHENSIVE',
                'description' => 'Full commercial vehicle coverage',
                'is_active' => true,
                'premium_multiplier' => 1.5,
                'sort_order' => 4,
                'form_fields' => [
                    ['name' => 'no_claim_discount', 'type' => 'select', 'label' => 'No Claim Discount', 'options' => [['label' => '0%', 'value' => '0'], ['label' => '10%', 'value' => '10'], ['label' => '20%', 'value' => '20'], ['label' => '30%', 'value' => '30']], 'required' => false, 'validation' => 'nullable'],
                ],
            ],
            [
                'policy_type_id' => $motor->id,
                'name' => 'Fleet Insurance',
                'code' => 'FLEET_INSURANCE',
                'description' => 'Insurance for multiple commercial vehicles',
                'is_active' => true,
                'premium_multiplier' => 1.2,
                'sort_order' => 5,
                'form_fields' => [
                    ['name' => 'fleet_size', 'type' => 'number', 'label' => 'Number of Vehicles in Fleet', 'required' => true, 'validation' => 'required|integer|min:2'],
                ],
            ],

            // Life Classes
            [
                'policy_type_id' => $life->id,
                'name' => 'Level Term',
                'code' => 'LEVEL_TERM',
                'description' => 'Fixed premium and sum assured throughout the term',
                'is_active' => true,
                'premium_multiplier' => 1.0,
                'sort_order' => 1,
                'form_fields' => [],
            ],
            [
                'policy_type_id' => $life->id,
                'name' => 'Decreasing Term',
                'code' => 'DECREASING_TERM',
                'description' => 'Sum assured decreases over the term (typically for mortgage protection)',
                'is_active' => true,
                'premium_multiplier' => 0.7,
                'sort_order' => 2,
                'form_fields' => [],
            ],
            [
                'policy_type_id' => $life->id,
                'name' => 'Increasing Term',
                'code' => 'INCREASING_TERM',
                'description' => 'Sum assured increases over the term to counter inflation',
                'is_active' => true,
                'premium_multiplier' => 1.3,
                'sort_order' => 3,
                'form_fields' => [
                    ['name' => 'increase_rate', 'type' => 'select', 'label' => 'Annual Increase Rate', 'options' => [['label' => '3%', 'value' => '3'], ['label' => '5%', 'value' => '5'], ['label' => '7%', 'value' => '7'], ['label' => '10%', 'value' => '10']], 'required' => true, 'validation' => 'required'],
                ],
            ],
            [
                'policy_type_id' => $life->id,
                'name' => 'Traditional Whole Life',
                'code' => 'TRADITIONAL_WHOLE_LIFE',
                'description' => 'Standard whole life with guaranteed cash value',
                'is_active' => true,
                'premium_multiplier' => 2.0,
                'sort_order' => 4,
                'form_fields' => [],
            ],
            [
                'policy_type_id' => $life->id,
                'name' => 'Universal Life',
                'code' => 'UNIVERSAL_LIFE',
                'description' => 'Flexible premium and death benefit whole life',
                'is_active' => true,
                'premium_multiplier' => 1.8,
                'sort_order' => 5,
                'form_fields' => [
                    ['name' => 'investment_option', 'type' => 'select', 'label' => 'Investment Option', 'options' => [['label' => 'Conservative', 'value' => 'conservative'], ['label' => 'Moderate', 'value' => 'moderate'], ['label' => 'Aggressive', 'value' => 'aggressive']], 'required' => true, 'validation' => 'required'],
                ],
            ],

            // Property Classes
            [
                'policy_type_id' => $property->id,
                'name' => 'Buildings Insurance',
                'code' => 'BUILDINGS_INSURANCE',
                'description' => 'Coverage for the structure of the building',
                'is_active' => true,
                'premium_multiplier' => 0.8,
                'sort_order' => 1,
                'form_fields' => [],
            ],
            [
                'policy_type_id' => $property->id,
                'name' => 'Contents Insurance',
                'code' => 'CONTENTS_INSURANCE',
                'description' => 'Coverage for personal belongings and contents',
                'is_active' => true,
                'premium_multiplier' => 0.6,
                'sort_order' => 2,
                'form_fields' => [],
            ],
            [
                'policy_type_id' => $property->id,
                'name' => 'Combined Buildings & Contents',
                'code' => 'COMBINED_BUILDINGS_CONTENTS',
                'description' => 'Comprehensive coverage for both building and contents',
                'is_active' => true,
                'premium_multiplier' => 1.2,
                'sort_order' => 3,
                'form_fields' => [
                    ['name' => 'high_value_items', 'type' => 'textarea', 'label' => 'High Value Items (Jewelry, Art, etc.)', 'required' => false, 'validation' => 'nullable|string'],
                ],
            ],
            [
                'policy_type_id' => $property->id,
                'name' => 'Office Buildings',
                'code' => 'OFFICE_BUILDINGS',
                'description' => 'Insurance for office buildings and related risks',
                'is_active' => true,
                'premium_multiplier' => 1.0,
                'sort_order' => 4,
                'form_fields' => [
                    ['name' => 'number_of_floors', 'type' => 'number', 'label' => 'Number of Floors', 'required' => true, 'validation' => 'required|integer|min:1'],
                ],
            ],
            [
                'policy_type_id' => $property->id,
                'name' => 'Industrial Buildings',
                'code' => 'INDUSTRIAL_BUILDINGS',
                'description' => 'Insurance for manufacturing and industrial facilities',
                'is_active' => true,
                'premium_multiplier' => 1.5,
                'sort_order' => 5,
                'form_fields' => [
                    ['name' => 'hazardous_materials', 'type' => 'select', 'label' => 'Hazardous Materials Present?', 'options' => [['label' => 'Yes', 'value' => 'yes'], ['label' => 'No', 'value' => 'no']], 'required' => true, 'validation' => 'required'],
                ],
            ],
            [
                'policy_type_id' => $property->id,
                'name' => 'Retail Spaces',
                'code' => 'RETAIL_SPACES',
                'description' => 'Insurance for retail shops and malls',
                'is_active' => true,
                'premium_multiplier' => 1.1,
                'sort_order' => 6,
                'form_fields' => [
                    ['name' => 'public_access', 'type' => 'select', 'label' => 'Public Access Level', 'options' => [['label' => 'Low', 'value' => 'low'], ['label' => 'Medium', 'value' => 'medium'], ['label' => 'High', 'value' => 'high']], 'required' => true, 'validation' => 'required'],
                ],
            ],
        ];

        foreach ($classes as $class) {
            PolicyClass::firstOrCreate(
                ['code' => $class['code']],
                $class
            );
        }

        $this->command->info('Policy classes seeded successfully!');
    }
}
