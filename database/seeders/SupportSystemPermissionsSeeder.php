<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SupportSystemPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions for the support system
        $permissions = [
            // Support ticket permissions
            'view_support_tickets',
            'create_support_tickets',
            'edit_support_tickets',
            'delete_support_tickets',
            'assign_tickets',
            'resolve_tickets',
            'close_tickets',
            'view_all_tickets',
            'escalate_tickets',

            // Knowledge base permissions
            'view_kb_articles',
            'create_kb_articles',
            'edit_kb_articles',
            'delete_kb_articles',
            'publish_kb_articles',
            'archive_kb_articles',
            'manage_kb_categories',
            'view_kb_analytics',

        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    private function assignPermissionsToRoles(): void
    {
        // Super Admin - Full access to everything
        $superAdmin = Role::where('name', 'super_admin')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo([
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets', 'delete_support_tickets',
                'assign_tickets', 'resolve_tickets', 'close_tickets', 'view_all_tickets', 'escalate_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles', 'delete_kb_articles',
                'publish_kb_articles', 'archive_kb_articles', 'manage_kb_categories', 'view_kb_analytics',
            ]);
        }

        // Underwriter - Full access to support features
        $underwriter = Role::where('name', 'underwriter')->first();
        if ($underwriter) {
            $underwriter->givePermissionTo([
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets', 'delete_support_tickets',
                'assign_tickets', 'resolve_tickets', 'close_tickets', 'view_all_tickets', 'escalate_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles', 'delete_kb_articles',
                'publish_kb_articles', 'archive_kb_articles', 'manage_kb_categories', 'view_kb_analytics',
            ]);
        }

        // Broker - Full access to support features
        $broker = Role::where('name', 'broker')->first();
        if ($broker) {
            $broker->givePermissionTo([
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets', 'delete_support_tickets',
                'assign_tickets', 'resolve_tickets', 'close_tickets', 'view_all_tickets', 'escalate_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles', 'delete_kb_articles',
                'publish_kb_articles', 'archive_kb_articles', 'manage_kb_categories', 'view_kb_analytics',
            ]);
        }

        // Underwriter Staff - Limited support access
        $underwriterStaff = Role::where('name', 'underwriter_staff')->first();
        if ($underwriterStaff) {
            $underwriterStaff->givePermissionTo([
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets',
                'assign_tickets', 'resolve_tickets', 'close_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles',
                'publish_kb_articles', 'archive_kb_articles',
            ]);
        }

        // Broker Staff - Limited support access
        $brokerStaff = Role::where('name', 'broker_staff')->first();
        if ($brokerStaff) {
            $brokerStaff->givePermissionTo([
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets',
                'assign_tickets', 'resolve_tickets', 'close_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles',
                'publish_kb_articles', 'archive_kb_articles',
            ]);
        }

        // Customer - Limited access to support features
        $customer = Role::where('name', 'customer')->first();
        if ($customer) {
            $customer->givePermissionTo([
                'view_support_tickets', 'create_support_tickets',
                'view_kb_articles',
            ]);
        }
    }
}
