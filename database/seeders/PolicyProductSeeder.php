<?php

namespace Database\Seeders;

use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PolicyProductSeeder extends Seeder
{
    public function run(): void
    {
        $classes = PolicyClass::with('policyType')->get()->keyBy('name');

        $products = [
            // Motor
            ['class' => 'Motor', 'name' => 'Comprehensive Motor'],
            ['class' => 'Motor', 'name' => 'Third Party Only'],
            ['class' => 'Motor', 'name' => 'Third Party Fire & Theft'],
            ['class' => 'Motor', 'name' => 'Fleet Motor'],
            ['class' => 'Motor', 'name' => 'Commercial Motor'],
            ['class' => 'Motor', 'name' => 'Private Motor'],

            // Fire & Special Perils
            ['class' => 'Fire & Special Perils', 'name' => 'Fire & Special Perils'],
            ['class' => 'Fire & Special Perils', 'name' => 'Fire Only'],
            ['class' => 'Fire & Special Perils', 'name' => 'Industrial All Risks'],
            ['class' => 'Fire & Special Perils', 'name' => 'Property All Risks'],
            ['class' => 'Fire & Special Perils', 'name' => 'Houseowners'],
            ['class' => 'Fire & Special Perils', 'name' => 'Householders'],
            ['class' => 'Fire & Special Perils', 'name' => 'Business Premises'],
            ['class' => 'Fire & Special Perils', 'name' => 'Office Package'],
            ['class' => 'Fire & Special Perils', 'name' => 'Shop Insurance'],

            // Marine
            ['class' => 'Marine', 'name' => 'Marine Cargo'],
            ['class' => 'Marine', 'name' => 'Marine Hull'],
            ['class' => 'Marine', 'name' => 'Inland Transit'],
            ['class' => 'Marine', 'name' => 'Goods in Transit'],
            ['class' => 'Marine', 'name' => 'Open Cover'],
            ['class' => 'Marine', 'name' => 'Specific Voyage'],

            // Engineering
            ['class' => 'Engineering', 'name' => 'Contractors All Risks'],
            ['class' => 'Engineering', 'name' => 'Erection All Risks'],
            ['class' => 'Engineering', 'name' => 'Machinery Breakdown'],
            ['class' => 'Engineering', 'name' => 'Boiler & Pressure Plant'],
            ['class' => 'Engineering', 'name' => 'Electronic Equipment'],
            ['class' => 'Engineering', 'name' => 'Deterioration of Stock'],

            // Aviation
            ['class' => 'Aviation', 'name' => 'Aircraft Hull'],
            ['class' => 'Aviation', 'name' => 'Aircraft Liability'],
            ['class' => 'Aviation', 'name' => 'Passenger Liability'],
            ['class' => 'Aviation', 'name' => 'Aviation Combined'],

            // Oil & Energy
            ['class' => 'Oil & Energy', 'name' => 'Offshore Package'],
            ['class' => 'Oil & Energy', 'name' => 'Onshore Package'],
            ['class' => 'Oil & Energy', 'name' => 'Energy All Risks'],

            // Bond / Credit
            ['class' => 'Bond / Credit', 'name' => 'Bid Bond'],
            ['class' => 'Bond / Credit', 'name' => 'Performance Bond'],
            ['class' => 'Bond / Credit', 'name' => 'Advance Payment Bond'],
            ['class' => 'Bond / Credit', 'name' => 'Customs Bond'],
            ['class' => 'Bond / Credit', 'name' => 'Fidelity Guarantee'],
            ['class' => 'Bond / Credit', 'name' => 'Credit Insurance'],

            // Accident
            ['class' => 'Accident', 'name' => 'Personal Accident'],
            ['class' => 'Accident', 'name' => 'Group Personal Accident'],
            ['class' => 'Accident', 'name' => 'Burglary'],
            ['class' => 'Accident', 'name' => 'Money Insurance'],
            ['class' => 'Accident', 'name' => 'Public Liability'],
            ['class' => 'Accident', 'name' => 'Product Liability'],
            ['class' => 'Accident', 'name' => 'Employer\'s Liability'],
            ['class' => 'Accident', 'name' => 'Professional Indemnity'],
            ['class' => 'Accident', 'name' => 'Occupiers Liability'],

            // Agriculture
            ['class' => 'Agriculture', 'name' => 'Crop Insurance'],
            ['class' => 'Agriculture', 'name' => 'Livestock Insurance'],
            ['class' => 'Agriculture', 'name' => 'Poultry Insurance'],
            ['class' => 'Agriculture', 'name' => 'Fishery Insurance'],

            // Miscellaneous
            ['class' => 'Miscellaneous', 'name' => 'Travel Insurance'],
            ['class' => 'Miscellaneous', 'name' => 'Event Insurance'],
            ['class' => 'Miscellaneous', 'name' => 'Golfers Insurance'],
            ['class' => 'Miscellaneous', 'name' => 'Mobile Device Insurance'],
            ['class' => 'Miscellaneous', 'name' => 'Gadget Insurance'],
            ['class' => 'Miscellaneous', 'name' => 'Cyber Insurance'],
            ['class' => 'Miscellaneous', 'name' => 'Directors & Officers Liability'],
            ['class' => 'Miscellaneous', 'name' => 'Political Violence'],
            ['class' => 'Miscellaneous', 'name' => 'Terrorism Cover'],

            // Various Policy
            ['class' => 'Various Policy', 'name' => 'Various Policy Schedule'],

            // Life - Individual Life
            ['class' => 'Individual Life', 'name' => 'Term Assurance'],
            ['class' => 'Individual Life', 'name' => 'Whole Life'],
            ['class' => 'Individual Life', 'name' => 'Endowment'],
            ['class' => 'Individual Life', 'name' => 'Education Plan'],
            ['class' => 'Individual Life', 'name' => 'Mortgage Protection'],
            ['class' => 'Individual Life', 'name' => 'Investment Linked'],
            ['class' => 'Individual Life', 'name' => 'Savings Plan'],

            // Life - Group Life
            ['class' => 'Group Life', 'name' => 'Group Life'],
            ['class' => 'Group Life', 'name' => 'Employee Group Life'],
            ['class' => 'Group Life', 'name' => 'Credit Life'],
            ['class' => 'Group Life', 'name' => 'Mortgage Life'],

            // Life - Annuity
            ['class' => 'Annuity', 'name' => 'Immediate Annuity'],
            ['class' => 'Annuity', 'name' => 'Deferred Annuity'],

            // Life - Micro Insurance
            ['class' => 'Micro Insurance', 'name' => 'Family Protection'],
            ['class' => 'Micro Insurance', 'name' => 'SME Protection'],
            ['class' => 'Micro Insurance', 'name' => 'Market Trader Protection'],
            ['class' => 'Micro Insurance', 'name' => 'Artisan Protection'],

            // Health
            ['class' => 'Individual Health', 'name' => 'Individual Health Plan'],
            ['class' => 'Group Health', 'name' => 'Family Health Plan'],
            ['class' => 'Group Health', 'name' => 'Corporate Health Plan'],
            ['class' => 'Group Health', 'name' => 'Executive Health Plan'],

            // Takaful General - Motor Takaful
            ['class' => 'Motor Takaful', 'name' => 'Comprehensive Motor Takaful'],
            ['class' => 'Motor Takaful', 'name' => 'Third Party Motor Takaful'],
            ['class' => 'Motor Takaful', 'name' => 'Third Party Fire & Theft Takaful'],
            ['class' => 'Motor Takaful', 'name' => 'Fleet Motor Takaful'],

            // Takaful General - Fire & Property Takaful
            ['class' => 'Fire & Property Takaful', 'name' => 'Fire & Special Perils Takaful'],
            ['class' => 'Fire & Property Takaful', 'name' => 'Houseowners Takaful'],
            ['class' => 'Fire & Property Takaful', 'name' => 'Householders Takaful'],
            ['class' => 'Fire & Property Takaful', 'name' => 'Property All Risks Takaful'],
            ['class' => 'Fire & Property Takaful', 'name' => 'Office Package Takaful'],
            ['class' => 'Fire & Property Takaful', 'name' => 'Shop Insurance Takaful'],

            // Takaful General - Marine Takaful
            ['class' => 'Marine Takaful', 'name' => 'Marine Cargo Takaful'],
            ['class' => 'Marine Takaful', 'name' => 'Marine Hull Takaful'],
            ['class' => 'Marine Takaful', 'name' => 'Goods in Transit Takaful'],
            ['class' => 'Marine Takaful', 'name' => 'Inland Transit Takaful'],

            // Takaful General - Engineering Takaful
            ['class' => 'Engineering Takaful', 'name' => 'Contractors All Risks Takaful'],
            ['class' => 'Engineering Takaful', 'name' => 'Erection All Risks Takaful'],
            ['class' => 'Engineering Takaful', 'name' => 'Machinery Breakdown Takaful'],
            ['class' => 'Engineering Takaful', 'name' => 'Electronic Equipment Takaful'],

            // Takaful General - Accident & Liability Takaful
            ['class' => 'Accident & Liability Takaful', 'name' => 'Personal Accident Takaful'],
            ['class' => 'Accident & Liability Takaful', 'name' => 'Group Personal Accident Takaful'],
            ['class' => 'Accident & Liability Takaful', 'name' => 'Public Liability Takaful'],
            ['class' => 'Accident & Liability Takaful', 'name' => 'Product Liability Takaful'],
            ['class' => 'Accident & Liability Takaful', 'name' => 'Professional Indemnity Takaful'],
            ['class' => 'Accident & Liability Takaful', 'name' => 'Employer\'s Liability Takaful'],
            ['class' => 'Accident & Liability Takaful', 'name' => 'Money Insurance Takaful'],
            ['class' => 'Accident & Liability Takaful', 'name' => 'Burglary Takaful'],

            // Takaful General - Agriculture Takaful
            ['class' => 'Agriculture Takaful', 'name' => 'Crop Takaful'],
            ['class' => 'Agriculture Takaful', 'name' => 'Livestock Takaful'],
            ['class' => 'Agriculture Takaful', 'name' => 'Poultry Takaful'],
            ['class' => 'Agriculture Takaful', 'name' => 'Fishery Takaful'],

            // Takaful General - Miscellaneous Takaful
            ['class' => 'Miscellaneous Takaful', 'name' => 'Travel Takaful'],
            ['class' => 'Miscellaneous Takaful', 'name' => 'Event Takaful'],
            ['class' => 'Miscellaneous Takaful', 'name' => 'Gadget Takaful'],
            ['class' => 'Miscellaneous Takaful', 'name' => 'Cyber Takaful'],

            // Takaful Family - Individual Family Takaful
            ['class' => 'Individual Family Takaful', 'name' => 'Family Protection Plan'],
            ['class' => 'Individual Family Takaful', 'name' => 'Individual Term Takaful'],
            ['class' => 'Individual Family Takaful', 'name' => 'Whole Life Takaful'],
            ['class' => 'Individual Family Takaful', 'name' => 'Education Takaful Plan'],
            ['class' => 'Individual Family Takaful', 'name' => 'Savings Takaful Plan'],
            ['class' => 'Individual Family Takaful', 'name' => 'Investment Linked Takaful'],

            // Takaful Family - Group Family Takaful
            ['class' => 'Group Family Takaful', 'name' => 'Group Family Takaful'],
            ['class' => 'Group Family Takaful', 'name' => 'Employee Family Protection'],
            ['class' => 'Group Family Takaful', 'name' => 'Group Credit Takaful'],
            ['class' => 'Group Family Takaful', 'name' => 'Mortgage Takaful'],

            // Takaful Family - Retirement & Pension Takaful
            ['class' => 'Retirement & Pension Takaful', 'name' => 'Retirement Savings Takaful'],
            ['class' => 'Retirement & Pension Takaful', 'name' => 'Retirement Income Takaful'],
            ['class' => 'Retirement & Pension Takaful', 'name' => 'Pension Protection Takaful'],

            // Takaful Family - Children's Education Takaful
            ['class' => 'Children\'s Education Takaful', 'name' => 'Education Savings Plan'],
            ['class' => 'Children\'s Education Takaful', 'name' => 'University Education Plan'],
            ['class' => 'Children\'s Education Takaful', 'name' => 'Child Future Plan'],

            // Takaful Family - Micro Takaful
            ['class' => 'Micro Takaful', 'name' => 'SME Protection'],
            ['class' => 'Micro Takaful', 'name' => 'Artisan Protection'],
            ['class' => 'Micro Takaful', 'name' => 'Market Trader Protection'],
            ['class' => 'Micro Takaful', 'name' => 'Family Micro Takaful'],
        ];

        $sortOrder = 1;

        foreach ($products as $productData) {
            if (! isset($classes[$productData['class']])) {
                continue; // Skip if class not found
            }

            $policyClass = $classes[$productData['class']];

            $code = strtoupper(Str::slug($productData['name'], '_'));

            PolicyProduct::updateOrCreate(
                [
                    'code' => $code,
                    'tenant_id' => null, // Platform template
                ],
                [
                    'policy_type_id' => $policyClass->policy_type_id,
                    'policy_class_id' => $policyClass->id,
                    'name' => $productData['name'],
                    'description' => $productData['name'].' standard template',
                    'is_active' => true,
                    'base_premium' => 0.00,
                    'commission_rate' => 0.00,
                    'default_coverage_period' => 365,
                    'min_sum_assured' => 0.00,
                    'requires_underwriting' => false,
                    'requires_medical_exam' => false,
                    'currency' => 'NGN',
                    'sort_order' => $sortOrder++,
                ]
            );
        }

        $this->command->info('Policy products seeded successfully!');
    }
}
