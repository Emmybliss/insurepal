<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class InsuranceProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Third Party Motor Insurance',
                'type' => 'auto',
                'description' => 'Mandatory motor insurance covering third party liabilities',
                'base_premium' => 15000.00,
                'form_fields' => [
                    ['name' => 'vehicle_type', 'type' => 'select', 'label' => 'Vehicle Type', 'options' => ['private', 'commercial'], 'required' => true],
                    ['name' => 'vehicle_value', 'type' => 'number', 'label' => 'Vehicle Value (₦)', 'required' => true],
                    ['name' => 'engine_capacity', 'type' => 'number', 'label' => 'Engine Capacity (CC)', 'required' => false],
                    ['name' => 'year_of_manufacture', 'type' => 'number', 'label' => 'Year of Manufacture', 'required' => true],
                    ['name' => 'driver_age', 'type' => 'number', 'label' => 'Primary Driver Age', 'required' => true],
                ],
                'premium_rules' => [
                    ['field' => 'vehicle_type', 'condition' => 'commercial', 'operator' => 'multiply', 'factor' => 1.5],
                    ['field' => 'driver_age', 'condition' => '<25', 'operator' => 'percentage', 'factor' => 20],
                    ['field' => 'vehicle_value', 'condition' => '>5000000', 'operator' => 'percentage', 'factor' => 15],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Comprehensive Motor Insurance',
                'type' => 'auto',
                'description' => 'Full coverage motor insurance including theft and damage',
                'base_premium' => 45000.00,
                'form_fields' => [
                    ['name' => 'vehicle_type', 'type' => 'select', 'label' => 'Vehicle Type', 'options' => ['private', 'commercial'], 'required' => true],
                    ['name' => 'vehicle_value', 'type' => 'number', 'label' => 'Vehicle Value (₦)', 'required' => true],
                    ['name' => 'engine_capacity', 'type' => 'number', 'label' => 'Engine Capacity (CC)', 'required' => false],
                    ['name' => 'year_of_manufacture', 'type' => 'number', 'label' => 'Year of Manufacture', 'required' => true],
                    ['name' => 'driver_age', 'type' => 'number', 'label' => 'Primary Driver Age', 'required' => true],
                    ['name' => 'excess_amount', 'type' => 'select', 'label' => 'Excess Amount', 'options' => ['50000', '100000', '200000'], 'required' => true],
                ],
                'premium_rules' => [
                    ['field' => 'vehicle_value', 'operator' => 'percentage', 'factor' => 3.5],
                    ['field' => 'excess_amount', 'condition' => '50000', 'operator' => 'percentage', 'factor' => 5],
                    ['field' => 'driver_age', 'condition' => '<25', 'operator' => 'percentage', 'factor' => 25],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Term Life Insurance',
                'type' => 'life',
                'description' => 'Temporary life insurance coverage for a specified period',
                'base_premium' => 25000.00,
                'form_fields' => [
                    ['name' => 'sum_assured', 'type' => 'number', 'label' => 'Sum Assured (₦)', 'required' => true],
                    ['name' => 'term_years', 'type' => 'select', 'label' => 'Policy Term (Years)', 'options' => ['5', '10', '15', '20', '25'], 'required' => true],
                    ['name' => 'smoker_status', 'type' => 'select', 'label' => 'Smoking Status', 'options' => ['non_smoker', 'smoker'], 'required' => true],
                    ['name' => 'occupation_risk', 'type' => 'select', 'label' => 'Occupation Risk', 'options' => ['low', 'medium', 'high'], 'required' => true],
                    ['name' => 'medical_history', 'type' => 'textarea', 'label' => 'Medical History', 'required' => false],
                ],
                'premium_rules' => [
                    ['field' => 'sum_assured', 'operator' => 'percentage', 'factor' => 0.5],
                    ['field' => 'smoker_status', 'condition' => 'smoker', 'operator' => 'percentage', 'factor' => 50],
                    ['field' => 'occupation_risk', 'condition' => 'high', 'operator' => 'percentage', 'factor' => 30],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Home Insurance',
                'type' => 'property',
                'description' => 'Comprehensive coverage for residential properties',
                'base_premium' => 35000.00,
                'form_fields' => [
                    ['name' => 'property_value', 'type' => 'number', 'label' => 'Property Value (₦)', 'required' => true],
                    ['name' => 'property_type', 'type' => 'select', 'label' => 'Property Type', 'options' => ['apartment', 'house', 'duplex', 'mansion'], 'required' => true],
                    ['name' => 'location_risk', 'type' => 'select', 'label' => 'Location Risk', 'options' => ['low', 'medium', 'high'], 'required' => true],
                    ['name' => 'security_features', 'type' => 'checkbox', 'label' => 'Security Features', 'options' => ['burglar_alarm', 'security_guard', 'cctv', 'fence'], 'required' => false],
                    ['name' => 'contents_coverage', 'type' => 'number', 'label' => 'Contents Coverage (₦)', 'required' => false],
                ],
                'premium_rules' => [
                    ['field' => 'property_value', 'operator' => 'percentage', 'factor' => 0.75],
                    ['field' => 'location_risk', 'condition' => 'high', 'operator' => 'percentage', 'factor' => 25],
                    ['field' => 'contents_coverage', 'operator' => 'percentage', 'factor' => 0.5],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Travel Insurance',
                'type' => 'travel',
                'description' => 'Coverage for domestic and international travel',
                'base_premium' => 8000.00,
                'form_fields' => [
                    ['name' => 'trip_type', 'type' => 'select', 'label' => 'Trip Type', 'options' => ['domestic', 'international'], 'required' => true],
                    ['name' => 'destination', 'type' => 'text', 'label' => 'Destination', 'required' => true],
                    ['name' => 'trip_duration', 'type' => 'number', 'label' => 'Trip Duration (Days)', 'required' => true],
                    ['name' => 'coverage_amount', 'type' => 'select', 'label' => 'Coverage Amount', 'options' => ['50000', '100000', '250000', '500000'], 'required' => true],
                    ['name' => 'activities', 'type' => 'checkbox', 'label' => 'Activities', 'options' => ['business', 'leisure', 'sports', 'adventure'], 'required' => true],
                ],
                'premium_rules' => [
                    ['field' => 'trip_type', 'condition' => 'international', 'operator' => 'multiply', 'factor' => 2.5],
                    ['field' => 'trip_duration', 'operator' => 'multiply', 'factor' => 50],
                    ['field' => 'coverage_amount', 'operator' => 'percentage', 'factor' => 2],
                ],
                'is_active' => true,
            ],
        ];

        foreach ($products as $product) {
            \App\Models\InsuranceProduct::create($product);
        }
    }
}
