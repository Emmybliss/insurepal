<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting database seeding...');

        // 1. First, seed roles and permissions (required for user creation)
        $this->command->info('📋 Seeding roles and permissions...');
        $this->call(RolesAndPermissionsSeeder::class);

        // Seed Insurance Companies reference data
        $this->command->info('🛡️ Seeding insurance companies...');
        $this->call(InsuranceCompaniesSeeder::class);

        // 1.1. Seed comprehensive permissions (most complete set)
        $this->command->info('📋 Seeding comprehensive permissions...');
        $this->call(ComprehensivePermissionsSeeder::class);

        // 1.2. Seed specialized permission modules
        $this->command->info('📋 Seeding claim permissions...');
        $this->call(ClaimPermissionsSeeder::class);

        $this->command->info('📋 Seeding tenant relationship permissions...');
        $this->call(TenantRelationshipPermissionsSeeder::class);

        $this->command->info('📋 Seeding support system permissions...');
        $this->call(SupportSystemPermissionsSeeder::class);

        $this->command->info('📋 Seeding document template permissions...');
        $this->call(DocumentTemplatePermissionsSeeder::class);

        $this->command->info('📋 Seeding certificate permissions...');
        $this->call(CertificatePermissionsSeeder::class);

        $this->command->info('📋 Seeding debit note permissions...');
        $this->call(DebitNoteSeeder::class);

        $this->command->info('📋 Seeding credit note permissions...');
        $this->call(CreditNoteSeeder::class);

        // 2. Create super admin user (no tenant required)
        $this->command->info('👤 Creating super admin...');
        $this->call(SuperAdminSeeder::class);

        // 3. Seed subscription plans (required before tenant creation)
        $this->command->info('💳 Seeding subscription plans...');
        $this->call(SubscriptionPlansSeeder::class);

        // 4. Seed policy structure (for super admin to manage)
        $this->command->info('📄 Seeding policy types...');
        $this->call(PolicyTypeSeeder::class);

        $this->command->info('🏷️ Seeding policy classes...');
        $this->call(PolicyClassSeeder::class);

        // 5. Seed insurance products
        $this->command->info('🛡️ Seeding insurance products...');
        $this->call(InsuranceProductSeeder::class);

        // 6. Seed policy products
        $this->command->info('📋 Seeding policy products...');
        $this->call(PolicyProductSeeder::class);

        // 7. Seed default document templates for all tenants
        $this->command->info('📄 Seeding default document templates...');

        // Check if we're in development environment to seed test data
        // if (app()->environment(['local', 'development'])) {
        //     $this->command->info('🧪 Environment is '.app()->environment().', seeding development data...');
        //     $this->call(DevelopmentDataSeeder::class);
        // }

        $this->command->info('✅ Database seeding completed successfully!');

        $this->command->line('');
        $this->command->line('🎉 Your InsurePal application is ready!');
        $this->command->line('');
        $this->command->line('Super Admin Credentials:');
        $this->command->line('📧 Email: admin@insurepal.com');
        $this->command->line('🔑 Password: password123!');
        $this->command->line('');

        if (app()->environment(['local', 'development'])) {
            $this->command->line('Development Test Accounts:');
            $this->command->line('🏢 Broker: broker@test.com (password: password)');
            $this->command->line('🏢 Underwriter: underwriter@test.com (password: password)');
            $this->command->line('👤 Customer: customer@test.com (password: password)');
        }

        $this->command->line('');
    }
}
