<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TenantRelationshipPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions for tenant relationships
        $permissions = [
            'view_tenant_relationships',
            'create_tenant_relationships',
            'accept_tenant_relationships',
            'decline_tenant_relationships',
            'remove_tenant_relationships',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign permissions to roles
        // Underwriters and Brokers can manage relationships
        $underwriterRole = Role::where('name', 'underwriter')->first();
        $underwriterAdminRole = Role::where('name', 'underwriter_admin')->first();
        $brokerRole = Role::where('name', 'broker')->first();
        $brokerAdminRole = Role::where('name', 'broker_admin')->first();
        $adminRole = Role::where('name', 'admin')->first();

        if ($underwriterRole) {
            $underwriterRole->givePermissionTo($permissions);
        }

        if ($underwriterAdminRole) {
            $underwriterAdminRole->givePermissionTo($permissions);
        }

        if ($brokerRole) {
            $brokerRole->givePermissionTo($permissions);
        }

        if ($brokerAdminRole) {
            $brokerAdminRole->givePermissionTo($permissions);
        }

        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
        }

        // Staff can view but not create/accept/decline
        $staffRoles = Role::whereIn('name', ['staff', 'underwriter_staff', 'broker_staff'])->get();
        foreach ($staffRoles as $staffRole) {
            $staffRole->givePermissionTo([
                'view_tenant_relationships',
            ]);
        }

        $this->command->info('Tenant relationship permissions created and assigned successfully.');
    }
}
