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
                'name' => 'Motor Insurance',
                'code' => 'MOTOR',
                'description' => 'Insurance coverage for vehicles including cars, trucks, and motorcycles',
                'is_active' => true,
                'sort_order' => 1,
                'form_fields' => [
                    [
                        'name' => 'vehicle_type',
                        'type' => 'select',
                        'label' => 'Vehicle Type',
                        'options' => [
                            ['label' => 'Private Car', 'value' => 'private_car'],
                            ['label' => 'Commercial Vehicle', 'value' => 'commercial'],
                            ['label' => 'Motorcycle', 'value' => 'motorcycle'],
                            ['label' => 'Truck', 'value' => 'truck'],
                        ],
                        'required' => true,
                        'validation' => 'required',
                    ],
                    [
                        'name' => 'chassis_number',
                        'type' => 'text',
                        'label' => 'Chassis Number',
                        'required' => true,
                        'validation' => 'required|string|max:50',
                    ],
                    [
                        'name' => 'engine_number',
                        'type' => 'text',
                        'label' => 'Engine Number',
                        'required' => true,
                        'validation' => 'required|string|max:50',
                    ],
                ],
            ],
            [
                'name' => 'Life Insurance',
                'code' => 'LIFE',
                'description' => 'Insurance coverage for life and health-related risks',
                'is_active' => true,
                'sort_order' => 2,
                'form_fields' => [
                    [
                        'name' => 'beneficiary_name',
                        'type' => 'text',
                        'label' => 'Primary Beneficiary',
                        'required' => true,
                        'validation' => 'required|string|max:255',
                    ],
                    [
                        'name' => 'beneficiary_relationship',
                        'type' => 'select',
                        'label' => 'Relationship to Beneficiary',
                        'options' => [
                            ['label' => 'Spouse', 'value' => 'spouse'],
                            ['label' => 'Child', 'value' => 'child'],
                            ['label' => 'Parent', 'value' => 'parent'],
                            ['label' => 'Sibling', 'value' => 'sibling'],
                            ['label' => 'Other', 'value' => 'other'],
                        ],
                        'required' => true,
                        'validation' => 'required',
                    ],
                ],
            ],
            [
                'name' => 'Property Insurance',
                'code' => 'PROPERTY',
                'description' => 'Insurance coverage for properties including homes and commercial buildings',
                'is_active' => true,
                'sort_order' => 3,
                'form_fields' => [
                    [
                        'name' => 'property_address',
                        'type' => 'textarea',
                        'label' => 'Property Address',
                        'required' => true,
                        'validation' => 'required|string',
                    ],
                    [
                        'name' => 'property_age',
                        'type' => 'number',
                        'label' => 'Property Age (Years)',
                        'required' => false,
                        'validation' => 'nullable|integer|min:0',
                    ],
                ],
            ],
            [
                'name' => 'Marine Insurance',
                'code' => 'MARINE',
                'description' => 'Insurance coverage for marine vessels and cargo',
                'is_active' => true,
                'sort_order' => 4,
                'form_fields' => [
                    [
                        'name' => 'vessel_name',
                        'type' => 'text',
                        'label' => 'Vessel Name',
                        'required' => true,
                        'validation' => 'required|string|max:255',
                    ],
                    [
                        'name' => 'vessel_type',
                        'type' => 'select',
                        'label' => 'Vessel Type',
                        'options' => [
                            ['label' => 'Cargo Ship', 'value' => 'cargo'],
                            ['label' => 'Passenger Ship', 'value' => 'passenger'],
                            ['label' => 'Fishing Boat', 'value' => 'fishing'],
                            ['label' => 'Yacht', 'value' => 'yacht'],
                        ],
                        'required' => true,
                        'validation' => 'required',
                    ],
                ],
            ],
            [
                'name' => 'Travel Insurance',
                'code' => 'TRAVEL',
                'description' => 'Insurance coverage for travel-related risks',
                'is_active' => true,
                'sort_order' => 5,
                'form_fields' => [
                    [
                        'name' => 'departure_date',
                        'type' => 'date',
                        'label' => 'Departure Date',
                        'required' => true,
                        'validation' => 'required|date|after:today',
                    ],
                    [
                        'name' => 'return_date',
                        'type' => 'date',
                        'label' => 'Return Date',
                        'required' => true,
                        'validation' => 'required|date|after:departure_date',
                    ],
                ],
            ],
        ];

        foreach ($policyTypes as $policyType) {
            PolicyType::firstOrCreate(
                ['code' => $policyType['code']],
                $policyType
            );
        }

        $this->command->info('Policy types seeded successfully!');
    }
}
