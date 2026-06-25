<?php

namespace Database\Seeders;

use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use Illuminate\Database\Seeder;

class PolicyProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $policyProducts = [
            // Motor Insurance Products
            [
                'policy_class_id' => 2, // Third Party Only
                'name' => 'Basic Third Party Motor',
                'code' => 'MOTOR-TPO-001',
                'description' => 'Mandatory third party motor insurance coverage',
                'base_premium' => 15000.00,
                'commission_rate' => 10.00,
                'min_sum_assured' => 1000000.00,
                'max_sum_assured' => 5000000.00,
                'form_fields' => [
                    ['name' => 'vehicle_type', 'type' => 'select', 'label' => 'Vehicle Type', 'options' => ['private', 'commercial'], 'required' => true],
                    ['name' => 'engine_capacity', 'type' => 'number', 'label' => 'Engine Capacity (CC)', 'required' => true],
                    ['name' => 'year_of_manufacture', 'type' => 'number', 'label' => 'Year of Manufacture', 'required' => true],
                    ['name' => 'driver_age', 'type' => 'number', 'label' => 'Primary Driver Age', 'required' => true],
                ],
                'premium_factors' => [
                    ['name' => 'vehicle_type', 'condition' => 'commercial', 'multiplier' => 1.5],
                    ['name' => 'driver_age', 'condition' => '<25', 'multiplier' => 1.3],
                ],
                'sort_order' => 1,
            ],
            [
                'policy_class_id' => 3, // Third Party Fire & Theft
                'name' => 'Third Party Fire & Theft Cover',
                'code' => 'MOTOR-TPFT-001',
                'description' => 'Third party coverage plus fire and theft protection',
                'base_premium' => 25000.00,
                'commission_rate' => 12.00,
                'min_sum_assured' => 1000000.00,
                'max_sum_assured' => 10000000.00,
                'form_fields' => [
                    ['name' => 'vehicle_value', 'type' => 'number', 'label' => 'Vehicle Market Value (₦)', 'required' => true],
                    ['name' => 'security_features', 'type' => 'checkbox', 'label' => 'Security Features', 'options' => ['alarm', 'immobilizer', 'tracker'], 'required' => false],
                ],
                'sort_order' => 2,
            ],
            [
                'policy_class_id' => 1, // Comprehensive Cover
                'name' => 'Full Comprehensive Motor',
                'code' => 'MOTOR-COMP-001',
                'description' => 'Complete motor insurance with all risks covered',
                'base_premium' => 45000.00,
                'commission_rate' => 15.00,
                'min_sum_assured' => 2000000.00,
                'max_sum_assured' => 50000000.00,
                'form_fields' => [
                    ['name' => 'vehicle_value', 'type' => 'number', 'label' => 'Vehicle Market Value (₦)', 'required' => true],
                    ['name' => 'excess_amount', 'type' => 'select', 'label' => 'Excess Amount', 'options' => ['50000', '100000', '200000'], 'required' => true],
                    ['name' => 'usage_type', 'type' => 'select', 'label' => 'Usage Type', 'options' => ['social_domestic', 'business', 'commercial'], 'required' => true],
                ],
                'premium_factors' => [
                    ['name' => 'vehicle_value', 'condition' => '>10000000', 'multiplier' => 1.2],
                    ['name' => 'usage_type', 'condition' => 'commercial', 'multiplier' => 1.4],
                ],
                'sort_order' => 3,
            ],

            // Life Insurance Products
            [
                'policy_class_id' => 6, // Level Term
                'name' => 'Level Term Life Insurance',
                'code' => 'LIFE-TERM-001',
                'description' => 'Fixed premium term life insurance with level death benefit',
                'base_premium' => 25000.00,
                'commission_rate' => 20.00,
                'min_sum_assured' => 1000000.00,
                'max_sum_assured' => 100000000.00,
                'form_fields' => [
                    ['name' => 'sum_assured', 'type' => 'number', 'label' => 'Sum Assured (₦)', 'required' => true],
                    ['name' => 'term_years', 'type' => 'select', 'label' => 'Policy Term (Years)', 'options' => ['5', '10', '15', '20', '25'], 'required' => true],
                    ['name' => 'smoker_status', 'type' => 'select', 'label' => 'Smoking Status', 'options' => ['non_smoker', 'smoker'], 'required' => true],
                    ['name' => 'occupation_class', 'type' => 'select', 'label' => 'Occupation Risk Class', 'options' => ['class_1', 'class_2', 'class_3', 'class_4'], 'required' => true],
                ],
                'premium_factors' => [
                    ['name' => 'smoker_status', 'condition' => 'smoker', 'multiplier' => 1.5],
                    ['name' => 'occupation_class', 'condition' => 'class_4', 'multiplier' => 2.0],
                ],
                'requires_medical_exam' => true,
                'sort_order' => 4,
            ],
            [
                'policy_class_id' => 9, // Traditional Whole Life
                'name' => 'Whole Life Insurance',
                'code' => 'LIFE-WHOLE-001',
                'description' => 'Permanent life insurance with cash value accumulation',
                'base_premium' => 50000.00,
                'commission_rate' => 25.00,
                'min_sum_assured' => 2000000.00,
                'max_sum_assured' => 200000000.00,
                'form_fields' => [
                    ['name' => 'payment_frequency', 'type' => 'select', 'label' => 'Premium Payment', 'options' => ['annual', 'semi_annual', 'quarterly', 'monthly'], 'required' => true],
                    ['name' => 'beneficiary_details', 'type' => 'textarea', 'label' => 'Beneficiary Information', 'required' => true],
                ],
                'requires_underwriting' => true,
                'requires_medical_exam' => true,
                'sort_order' => 5,
            ],

            // Property Insurance Products
            [
                'policy_class_id' => 11, // Buildings Insurance
                'name' => 'Residential Buildings Insurance',
                'code' => 'PROP-BLDG-001',
                'description' => 'Coverage for residential building structures',
                'base_premium' => 35000.00,
                'commission_rate' => 15.00,
                'min_sum_assured' => 5000000.00,
                'max_sum_assured' => 500000000.00,
                'form_fields' => [
                    ['name' => 'property_value', 'type' => 'number', 'label' => 'Property Replacement Value (₦)', 'required' => true],
                    ['name' => 'property_type', 'type' => 'select', 'label' => 'Property Type', 'options' => ['bungalow', 'duplex', 'apartment', 'mansion'], 'required' => true],
                    ['name' => 'construction_type', 'type' => 'select', 'label' => 'Construction Type', 'options' => ['concrete', 'brick', 'wood', 'mixed'], 'required' => true],
                    ['name' => 'location_state', 'type' => 'select', 'label' => 'State', 'options' => ['lagos', 'abuja', 'kano', 'rivers', 'other'], 'required' => true],
                ],
                'premium_factors' => [
                    ['name' => 'location_state', 'condition' => 'lagos', 'multiplier' => 1.2],
                    ['name' => 'construction_type', 'condition' => 'wood', 'multiplier' => 1.8],
                ],
                'sort_order' => 6,
            ],
            [
                'policy_class_id' => 12, // Contents Insurance
                'name' => 'Home Contents Insurance',
                'code' => 'PROP-CONT-001',
                'description' => 'Coverage for household contents and personal belongings',
                'base_premium' => 20000.00,
                'commission_rate' => 12.00,
                'min_sum_assured' => 1000000.00,
                'max_sum_assured' => 50000000.00,
                'form_fields' => [
                    ['name' => 'contents_value', 'type' => 'number', 'label' => 'Total Contents Value (₦)', 'required' => true],
                    ['name' => 'high_value_items', 'type' => 'textarea', 'label' => 'High Value Items (₦500k+)', 'required' => false],
                    ['name' => 'security_level', 'type' => 'select', 'label' => 'Security Level', 'options' => ['basic', 'moderate', 'high'], 'required' => true],
                ],
                'sort_order' => 7,
            ],
            [
                'policy_class_id' => 13, // Combined Buildings & Contents
                'name' => 'Combined Home Insurance',
                'code' => 'PROP-COMB-001',
                'description' => 'Combined buildings and contents insurance package',
                'base_premium' => 50000.00,
                'commission_rate' => 18.00,
                'min_sum_assured' => 10000000.00,
                'max_sum_assured' => 1000000000.00,
                'form_fields' => [
                    ['name' => 'building_value', 'type' => 'number', 'label' => 'Building Replacement Value (₦)', 'required' => true],
                    ['name' => 'contents_value', 'type' => 'number', 'label' => 'Contents Value (₦)', 'required' => true],
                    ['name' => 'alternative_accommodation', 'type' => 'select', 'label' => 'Alternative Accommodation Limit', 'options' => ['10_percent', '15_percent', '20_percent'], 'required' => true],
                ],
                'sort_order' => 8,
            ],

            // Commercial Products
            [
                'policy_class_id' => 4, // Commercial Comprehensive
                'name' => 'Commercial Vehicle Fleet',
                'code' => 'COMM-FLEET-001',
                'description' => 'Comprehensive coverage for commercial vehicle fleets',
                'base_premium' => 75000.00,
                'commission_rate' => 20.00,
                'min_sum_assured' => 5000000.00,
                'max_sum_assured' => 500000000.00,
                'form_fields' => [
                    ['name' => 'fleet_size', 'type' => 'number', 'label' => 'Number of Vehicles', 'required' => true],
                    ['name' => 'business_type', 'type' => 'select', 'label' => 'Business Type', 'options' => ['logistics', 'taxi', 'delivery', 'construction', 'other'], 'required' => true],
                    ['name' => 'average_vehicle_value', 'type' => 'number', 'label' => 'Average Vehicle Value (₦)', 'required' => true],
                ],
                'premium_factors' => [
                    ['name' => 'business_type', 'condition' => 'construction', 'multiplier' => 1.5],
                    ['name' => 'fleet_size', 'condition' => '>10', 'multiplier' => 0.9], // Volume discount
                ],
                'requires_underwriting' => true,
                'sort_order' => 9,
            ],
            [
                'policy_class_id' => 14, // Office Buildings
                'name' => 'Commercial Office Insurance',
                'code' => 'COMM-OFFICE-001',
                'description' => 'Insurance coverage for commercial office buildings',
                'base_premium' => 100000.00,
                'commission_rate' => 15.00,
                'min_sum_assured' => 50000000.00,
                'max_sum_assured' => 5000000000.00,
                'form_fields' => [
                    ['name' => 'building_area', 'type' => 'number', 'label' => 'Total Floor Area (sqm)', 'required' => true],
                    ['name' => 'occupancy_type', 'type' => 'select', 'label' => 'Primary Occupancy', 'options' => ['single_tenant', 'multi_tenant', 'mixed_use'], 'required' => true],
                    ['name' => 'fire_safety_rating', 'type' => 'select', 'label' => 'Fire Safety Rating', 'options' => ['excellent', 'good', 'fair', 'poor'], 'required' => true],
                ],
                'requires_underwriting' => true,
                'sort_order' => 10,
            ],
        ];

        foreach ($policyProducts as $productData) {
            $policyClass = PolicyClass::with('policyType')->find($productData['policy_class_id']);

            if ($policyClass) {
                $productData['policy_type_id'] = $policyClass->policyType->id;

                PolicyProduct::create($productData);
            }
        }
    }
}
