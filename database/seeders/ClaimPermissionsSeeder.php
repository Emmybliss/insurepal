<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ClaimPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Basic CRUD permissions
            'view_claims' => 'Ability to view claims',
            'create_claims' => 'Ability to create new claims',
            'edit_claims' => 'Ability to edit claims',
            'delete_claims' => 'Ability to delete claims',

            // Workflow permissions
            'review_claims' => 'Ability to review and process claims',
            'approve_claims' => 'Ability to approve or reject claims',
            'settle_claims' => 'Ability to settle and close claims',
        ];

        // Create permissions (only if they don't exist)
        foreach ($permissions as $permissionName => $description) {
            Permission::firstOrCreate(
                ['name' => $permissionName],
                ['guard_name' => 'web']
            );
        }

        // Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    /**
     * Assign claim permissions to appropriate roles.
     */
    private function assignPermissionsToRoles(): void
    {
        // Super Admin gets all permissions (handled globally)

        // Underwriter role
        $underwriterRole = Role::where('name', 'underwriter')->first();
        if ($underwriterRole) {
            $underwriterRole->givePermissionTo([
                'view_claims',
                'create_claims',
                'edit_claims',
                'delete_claims',
                'review_claims',
                'approve_claims',
                'settle_claims',
            ]);
        }

        // Broker role
        $brokerRole = Role::where('name', 'broker')->first();
        if ($brokerRole) {
            $brokerRole->givePermissionTo([
                'view_claims',
                'create_claims',
                'edit_claims',
                'delete_claims',
                'review_claims',
                'approve_claims',
            ]);
        }

        // Staff role (for both underwriters and brokers)
        $staffRole = Role::where('name', 'staff')->first();
        if ($staffRole) {
            $staffRole->givePermissionTo([
                'view_claims',
                'create_claims',
                'edit_claims',
            ]);
        }

        // Customer role
        $customerRole = Role::where('name', 'customer')->first();
        if ($customerRole) {
            $customerRole->givePermissionTo([
                'view_claims',
                'create_claims',
                'edit_claims',
            ]);
        }
    }
}
