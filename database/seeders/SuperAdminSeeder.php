<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create super admin user
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@insurepal.com'],
            [
                'name' => 'Super Administrator',
                'email' => 'admin@insurepal.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'tenant_id' => null, // Super admin doesn't belong to any tenant
                'is_active' => true,
            ]
        );

        // Assign super_admin role
        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($superAdminRole && ! $superAdmin->hasRole('super_admin')) {
            $superAdmin->assignRole('super_admin');
        }

        $this->command->info('Super admin user created/updated successfully!');
        $this->command->info('Email: admin@insurepal.com');
        $this->command->info('Password: password');
        $this->command->info('Roles: '.$superAdmin->roles->pluck('name')->join(', '));
        $this->command->info('Permissions: '.$superAdmin->getAllPermissions()->count().' permissions');
    }
}
