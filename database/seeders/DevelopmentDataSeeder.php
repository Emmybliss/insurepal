<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Quote;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevelopmentDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating development test data...');

        // Get subscription plans
        $starterPlan = SubscriptionPlan::where('slug', 'starter')->first();
        $professionalPlan = SubscriptionPlan::where('slug', 'professional')->first();

        // Create test tenants
        $brokerTenant = Tenant::create([
            'name' => 'Demo Insurance Brokerage Ltd',
            'type' => 'broker',
            'email' => 'admin@demobroker.com',
            'phone' => '+234 801 234 5678',
            'address' => '123 Victoria Island, Lagos, Nigeria',
            'status' => 'active',
            'trial_ends_at' => null,
        ]);

        $underwriterTenant = Tenant::create([
            'name' => 'Premium Underwriters Nigeria',
            'type' => 'underwriter',
            'email' => 'info@premiumunder.ng',
            'phone' => '+234 802 345 6789',
            'address' => '456 Ikoyi, Lagos, Nigeria',
            'status' => 'active',
            'trial_ends_at' => null,
        ]);

        // Create test users for broker tenant
        $brokerAdmin = User::create([
            'name' => 'Demo Broker Admin',
            'email' => 'broker@test.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'tenant_id' => $brokerTenant->id,
        ]);
        $brokerAdmin->assignRole('broker');

        $brokerStaff = User::create([
            'name' => 'Demo Broker Staff',
            'email' => 'staff@demobroker.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'tenant_id' => $brokerTenant->id,
        ]);
        $brokerStaff->assignRole('broker_staff');

        // Create test users for underwriter tenant
        $underwriterAdmin = User::create([
            'name' => 'Premium Underwriter Admin',
            'email' => 'underwriter@test.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'tenant_id' => $underwriterTenant->id,
        ]);
        $underwriterAdmin->assignRole('underwriter');

        // Create test customers for broker
        $brokerCustomers = [
            [
                'tenant_id' => $brokerTenant->id,
                'type' => 'individual',
                'first_name' => 'John',
                'last_name' => 'Adebayo',
                'email' => 'john.adebayo@gmail.com',
                'phone' => '+234 803 123 4567',
                'date_of_birth' => '1985-03-15',
                'gender' => 'male',
                'occupation' => 'Software Engineer',
                'annual_income' => 5000000,
                'address' => '12 Lekki Phase 1, Lagos',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'country' => 'Nigeria',
                'is_active' => true,
            ],
            [
                'tenant_id' => $brokerTenant->id,
                'type' => 'corporate',
                'company_name' => 'TechHub Nigeria Ltd',
                'email' => 'info@techhub.ng',
                'phone' => '+234 804 234 5678',
                'address' => '45 Computer Village, Ikeja, Lagos',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'country' => 'Nigeria',
                'is_active' => true,
            ],
            [
                'tenant_id' => $brokerTenant->id,
                'type' => 'individual',
                'first_name' => 'Aisha',
                'last_name' => 'Mohammed',
                'email' => 'aisha.mohammed@yahoo.com',
                'phone' => '+234 805 345 6789',
                'date_of_birth' => '1990-07-22',
                'gender' => 'female',
                'occupation' => 'Doctor',
                'annual_income' => 8000000,
                'address' => '78 Maitama, Abuja',
                'city' => 'Abuja',
                'state' => 'FCT',
                'country' => 'Nigeria',
                'is_active' => true,
            ],
        ];

        $customers = [];
        foreach ($brokerCustomers as $customerData) {
            $customers[] = Customer::create($customerData);
        }

        // Create test customers for underwriter
        $underwriterCustomers = [
            [
                'tenant_id' => $underwriterTenant->id,
                'type' => 'corporate',
                'company_name' => 'Lagos Transport Co.',
                'email' => 'fleet@lagostransport.ng',
                'phone' => '+234 806 456 7890',
                'address' => '89 Oregun Road, Ikeja, Lagos',
                'city' => 'Lagos',
                'state' => 'Lagos',
                'country' => 'Nigeria',
                'is_active' => true,
            ],
            [
                'tenant_id' => $underwriterTenant->id,
                'type' => 'individual',
                'first_name' => 'Chidi',
                'last_name' => 'Okafor',
                'email' => 'chidi.okafor@gmail.com',
                'phone' => '+234 807 567 8901',
                'date_of_birth' => '1982-11-30',
                'gender' => 'male',
                'occupation' => 'Business Owner',
                'annual_income' => 12000000,
                'address' => '23 GRA, Port Harcourt',
                'city' => 'Port Harcourt',
                'state' => 'Rivers',
                'country' => 'Nigeria',
                'is_active' => true,
            ],
        ];

        foreach ($underwriterCustomers as $customerData) {
            $customers[] = Customer::create($customerData);
        }

        // Create a customer user account for testing customer portal
        $customerUser = User::create([
            'name' => 'John Adebayo',
            'email' => 'customer@test.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'tenant_id' => null, // Customers don't belong to tenants directly
        ]);
        $customerUser->assignRole('customer');

        // Link customer user to a customer record
        $johnCustomer = Customer::where('email', 'john.adebayo@gmail.com')->first();
        $johnCustomer->update(['user_id' => $customerUser->id]);

        // Get insurance products
        $motorInsurance = InsuranceProduct::where('type', 'auto')->first();
        $lifeInsurance = InsuranceProduct::where('type', 'life')->first();
        $homeInsurance = InsuranceProduct::where('type', 'property')->first();

        // Create test quotes for broker customers
        if ($motorInsurance && $customers[0]) {
            Quote::create([
                'tenant_id' => $brokerTenant->id,
                'customer_id' => $customers[0]->id,
                'insurance_product_id' => $motorInsurance->id,
                'quote_number' => 'QT'.now()->year.'000001',
                'status' => 'sent',
                'coverage_details' => [
                    [
                        'type' => 'Comprehensive Coverage',
                        'amount' => 2500000,
                        'description' => 'Full motor insurance coverage',
                    ],
                ],
                'premium_amount' => 85000.00,
                'commission_amount' => 8500.00,
                'total_amount' => 93500.00,
                'valid_until' => now()->addDays(30),
                'form_data' => [
                    'vehicle_type' => 'private',
                    'vehicle_value' => 2500000,
                    'year_of_manufacture' => 2020,
                    'driver_age' => 38,
                ],
                'notes' => 'Toyota Camry 2020 model - Comprehensive coverage',
                'internal_notes' => 'Good customer with clean driving record',
                'created_by' => $brokerAdmin->id,
                'sent_at' => now()->subDays(5),
            ]);
        }

        if ($lifeInsurance && $customers[2]) {
            Quote::create([
                'tenant_id' => $brokerTenant->id,
                'customer_id' => $customers[2]->id,
                'insurance_product_id' => $lifeInsurance->id,
                'quote_number' => 'QT'.now()->year.'000002',
                'status' => 'accepted',
                'coverage_details' => [
                    [
                        'type' => 'Term Life Coverage',
                        'amount' => 10000000,
                        'description' => '20-year term life insurance',
                    ],
                ],
                'premium_amount' => 120000.00,
                'commission_amount' => 12000.00,
                'total_amount' => 132000.00,
                'valid_until' => now()->addDays(20),
                'form_data' => [
                    'sum_assured' => 10000000,
                    'term_years' => '20',
                    'smoker_status' => 'non_smoker',
                    'occupation_risk' => 'low',
                ],
                'notes' => '20-year term life insurance for medical professional',
                'created_by' => $brokerAdmin->id,
                'sent_at' => now()->subDays(10),
                'accepted_at' => now()->subDays(3),
            ]);
        }

        // Create a draft quote
        if ($homeInsurance && $customers[1]) {
            Quote::create([
                'tenant_id' => $brokerTenant->id,
                'customer_id' => $customers[1]->id,
                'insurance_product_id' => $homeInsurance->id,
                'quote_number' => 'QT'.now()->year.'000003',
                'status' => 'draft',
                'coverage_details' => [
                    [
                        'type' => 'Property Coverage',
                        'amount' => 15000000,
                        'description' => 'Commercial property insurance',
                    ],
                ],
                'premium_amount' => 180000.00,
                'commission_amount' => 18000.00,
                'total_amount' => 198000.00,
                'valid_until' => now()->addDays(30),
                'form_data' => [
                    'property_value' => 15000000,
                    'property_type' => 'house',
                    'location_risk' => 'medium',
                ],
                'notes' => 'Commercial property insurance for tech company office',
                'internal_notes' => 'Requires site inspection before finalization',
                'created_by' => $brokerStaff->id,
            ]);
        }

        // Create quotes for underwriter customers
        if ($motorInsurance && isset($customers[3])) {
            Quote::create([
                'tenant_id' => $underwriterTenant->id,
                'customer_id' => $customers[3]->id,
                'insurance_product_id' => $motorInsurance->id,
                'quote_number' => 'QT'.now()->year.'000004',
                'status' => 'sent',
                'coverage_details' => [
                    [
                        'type' => 'Fleet Coverage',
                        'amount' => 25000000,
                        'description' => 'Commercial fleet insurance for 10 vehicles',
                    ],
                ],
                'premium_amount' => 450000.00,
                'commission_amount' => 45000.00,
                'total_amount' => 495000.00,
                'valid_until' => now()->addDays(25),
                'form_data' => [
                    'vehicle_type' => 'commercial',
                    'vehicle_value' => 25000000,
                    'year_of_manufacture' => 2019,
                    'driver_age' => 35,
                ],
                'notes' => 'Fleet insurance for transport company',
                'internal_notes' => 'Large fleet discount applied',
                'created_by' => $underwriterAdmin->id,
                'sent_at' => now()->subDays(2),
            ]);
        }

        // Seed tenant-specific roles and permissions for all tenants
        $this->command->info('📋 Seeding tenant-specific roles and permissions...');
        $this->call(TenantRolesAndPermissionsSeeder::class);

        $this->command->info('✅ Development test data created successfully!');
        $this->command->line('📊 Created:');
        $this->command->line('  • 2 test tenants (1 broker, 1 underwriter)');
        $this->command->line('  • 4 test users with different roles');
        $this->command->line('  • 5 test customers (3 broker, 2 underwriter)');
        $this->command->line('  • 4 sample quotes in different statuses');
        $this->command->line('  • 1 customer portal user account');
    }
}
