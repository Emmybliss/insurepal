<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TenantRolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $this->seedTenantPermissions($tenant);
            $this->seedTenantRoles($tenant);
        }
    }

    private function seedTenantPermissions(Tenant $tenant): void
    {
        $permissions = [
            // User Management
            ['name' => 'users.view', 'display_name' => 'View Users', 'category' => 'user_management', 'description' => 'View user list and details'],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'category' => 'user_management', 'description' => 'Create new users'],
            ['name' => 'users.edit', 'display_name' => 'Edit Users', 'category' => 'user_management', 'description' => 'Edit user information'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'category' => 'user_management', 'description' => 'Delete users from system'],
            ['name' => 'users.manage_roles', 'display_name' => 'Manage User Roles', 'category' => 'user_management', 'description' => 'Assign and remove user roles'],

            // Customer Management
            ['name' => 'customers.view', 'display_name' => 'View Customers', 'category' => 'customer_management', 'description' => 'View customer list and details'],
            ['name' => 'customers.create', 'display_name' => 'Create Customers', 'category' => 'customer_management', 'description' => 'Create new customers'],
            ['name' => 'customers.edit', 'display_name' => 'Edit Customers', 'category' => 'customer_management', 'description' => 'Edit customer information'],
            ['name' => 'customers.delete', 'display_name' => 'Delete Customers', 'category' => 'customer_management', 'description' => 'Delete customers from system'],

            // Quote Management
            ['name' => 'quotes.view', 'display_name' => 'View Quotes', 'category' => 'quote_management', 'description' => 'View quote list and details'],
            ['name' => 'quotes.create', 'display_name' => 'Create Quotes', 'category' => 'quote_management', 'description' => 'Create new quotes'],
            ['name' => 'quotes.edit', 'display_name' => 'Edit Quotes', 'category' => 'quote_management', 'description' => 'Edit quote information'],
            ['name' => 'quotes.delete', 'display_name' => 'Delete Quotes', 'category' => 'quote_management', 'description' => 'Delete quotes from system'],
            ['name' => 'quotes.send', 'display_name' => 'Send Quotes', 'category' => 'quote_management', 'description' => 'Send quotes to customers'],
            ['name' => 'quotes.convert', 'display_name' => 'Convert Quotes', 'category' => 'quote_management', 'description' => 'Convert quotes to policies'],

            // Policy Management
            ['name' => 'policies.view', 'display_name' => 'View Policies', 'category' => 'policy_management', 'description' => 'View policy list and details'],
            ['name' => 'policies.create', 'display_name' => 'Create Policies', 'category' => 'policy_management', 'description' => 'Create new policies'],
            ['name' => 'policies.edit', 'display_name' => 'Edit Policies', 'category' => 'policy_management', 'description' => 'Edit policy information'],
            ['name' => 'policies.delete', 'display_name' => 'Delete Policies', 'category' => 'policy_management', 'description' => 'Delete policies from system'],
            ['name' => 'policies.renew', 'display_name' => 'Renew Policies', 'category' => 'policy_management', 'description' => 'Process policy renewals'],
            ['name' => 'policies.cancel', 'display_name' => 'Cancel Policies', 'category' => 'policy_management', 'description' => 'Cancel active policies'],

            // Financial Notes
            ['name' => 'financial_notes.view', 'display_name' => 'View Financial Notes', 'category' => 'financial_management', 'description' => 'View debit/credit notes'],
            ['name' => 'financial_notes.create', 'display_name' => 'Create Financial Notes', 'category' => 'financial_management', 'description' => 'Create debit/credit notes'],
            ['name' => 'financial_notes.edit', 'display_name' => 'Edit Financial Notes', 'category' => 'financial_management', 'description' => 'Edit financial notes'],
            ['name' => 'financial_notes.delete', 'display_name' => 'Delete Financial Notes', 'category' => 'financial_management', 'description' => 'Delete financial notes'],
            ['name' => 'financial_notes.issue', 'display_name' => 'Issue Financial Notes', 'category' => 'financial_management', 'description' => 'Issue financial notes to customers'],

            // Reports
            ['name' => 'reports.view', 'display_name' => 'View Reports', 'category' => 'reporting', 'description' => 'Access reporting dashboard'],
            ['name' => 'reports.naicom', 'display_name' => 'NAICOM Reports', 'category' => 'reporting', 'description' => 'Generate NAICOM compliance reports'],
            ['name' => 'reports.business', 'display_name' => 'Business Reports', 'category' => 'reporting', 'description' => 'Generate business overview reports'],
            ['name' => 'reports.export', 'display_name' => 'Export Reports', 'category' => 'reporting', 'description' => 'Export reports to various formats'],

            // NAICOM Reporting
            ['name' => 'naicom-reports.view', 'display_name' => 'View NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'View NAICOM report runs'],
            ['name' => 'naicom-reports.generate', 'display_name' => 'Generate NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'Generate new NAICOM report runs'],
            ['name' => 'naicom-reports.review', 'display_name' => 'Review NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'Review and validate NAICOM reports'],
            ['name' => 'naicom-reports.adjust', 'display_name' => 'Adjust NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'Create manual adjustments on NAICOM reports'],
            ['name' => 'naicom-reports.approve', 'display_name' => 'Approve NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'Approve NAICOM reports for submission'],
            ['name' => 'naicom-reports.lock', 'display_name' => 'Lock NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'Lock approved NAICOM reports against changes'],
            ['name' => 'naicom-reports.export', 'display_name' => 'Export NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'Export NAICOM reports to Excel/PDF'],
            ['name' => 'naicom-reports.submit', 'display_name' => 'Submit NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'Mark NAICOM reports as submitted'],
            ['name' => 'naicom-reports.restate', 'display_name' => 'Restate NAICOM Reports', 'category' => 'naicom_reporting', 'description' => 'Create restated versions of NAICOM reports'],

            // Messages
            ['name' => 'messages.view', 'display_name' => 'View Messages', 'category' => 'communication', 'description' => 'View message inbox'],
            ['name' => 'messages.send', 'display_name' => 'Send Messages', 'category' => 'communication', 'description' => 'Send messages to users'],
            ['name' => 'messages.manage', 'display_name' => 'Manage Messages', 'category' => 'communication', 'description' => 'Delete and organize messages'],

            // Settings
            ['name' => 'settings.view', 'display_name' => 'View Settings', 'category' => 'system_settings', 'description' => 'View tenant settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'category' => 'system_settings', 'description' => 'Edit tenant settings and configuration'],

            // Role Management (for tenant admins)
            ['name' => 'roles.view', 'display_name' => 'View Roles', 'category' => 'role_management', 'description' => 'View roles and permissions'],
            ['name' => 'roles.create', 'display_name' => 'Create Roles', 'category' => 'role_management', 'description' => 'Create custom roles'],
            ['name' => 'roles.edit', 'display_name' => 'Edit Roles', 'category' => 'role_management', 'description' => 'Edit role permissions'],
            ['name' => 'roles.delete', 'display_name' => 'Delete Roles', 'category' => 'role_management', 'description' => 'Delete custom roles'],
            ['name' => 'permissions.view', 'display_name' => 'View Permissions', 'category' => 'role_management', 'description' => 'View available permissions'],
            ['name' => 'permissions.create', 'display_name' => 'Create Permissions', 'category' => 'role_management', 'description' => 'Create custom permissions'],
            ['name' => 'permissions.edit', 'display_name' => 'Edit Permissions', 'category' => 'role_management', 'description' => 'Edit permission details'],
            ['name' => 'permissions.delete', 'display_name' => 'Delete Permissions', 'category' => 'role_management', 'description' => 'Delete custom permissions'],

            // Tenant Relationships
            ['name' => 'view_tenant_relationships', 'display_name' => 'View Relationships', 'category' => 'tenant_relationships', 'description' => 'View tenant relationships'],
            ['name' => 'create_tenant_relationships', 'display_name' => 'Create Relationships', 'category' => 'tenant_relationships', 'description' => 'Send relationship requests'],
            ['name' => 'accept_tenant_relationships', 'display_name' => 'Accept Relationships', 'category' => 'tenant_relationships', 'description' => 'Accept relationship requests'],
            ['name' => 'decline_tenant_relationships', 'display_name' => 'Decline Relationships', 'category' => 'tenant_relationships', 'description' => 'Decline relationship requests'],
            ['name' => 'remove_tenant_relationships', 'display_name' => 'Remove Relationships', 'category' => 'tenant_relationships', 'description' => 'Remove existing relationships'],

            // Placement Management
            ['name' => 'placements.view', 'display_name' => 'View Placements', 'category' => 'placement_management', 'description' => 'View placement list and details'],
            ['name' => 'placements.create', 'display_name' => 'Create Placements', 'category' => 'placement_management', 'description' => 'Create new placements'],
            ['name' => 'placements.edit', 'display_name' => 'Edit Placements', 'category' => 'placement_management', 'description' => 'Edit placement information'],
            ['name' => 'placements.delete', 'display_name' => 'Delete Placements', 'category' => 'placement_management', 'description' => 'Delete placements from system'],
            ['name' => 'placements.submit_to_market', 'display_name' => 'Submit to Market', 'category' => 'placement_management', 'description' => 'Submit placements to insurance market'],
            ['name' => 'placements.convert_to_policy', 'display_name' => 'Convert to Policy', 'category' => 'placement_management', 'description' => 'Convert placed placements to policies'],

            // Placement Market Management
            ['name' => 'markets.view', 'display_name' => 'View Markets', 'category' => 'market_management', 'description' => 'View insurance markets on placements'],
            ['name' => 'markets.create', 'display_name' => 'Add Markets', 'category' => 'market_management', 'description' => 'Add insurers to placements'],
            ['name' => 'markets.edit', 'display_name' => 'Edit Markets', 'category' => 'market_management', 'description' => 'Edit market participation details'],
            ['name' => 'markets.delete', 'display_name' => 'Remove Markets', 'category' => 'market_management', 'description' => 'Remove insurers from placements'],
            ['name' => 'markets.respond', 'display_name' => 'Respond to Markets', 'category' => 'market_management', 'description' => 'Record insurer responses'],

            // Broker Slip Management
            ['name' => 'broker_slips.view', 'display_name' => 'View Broker Slips', 'category' => 'broker_slip_management', 'description' => 'View broker slip list and details'],
            ['name' => 'broker_slips.create', 'display_name' => 'Create Broker Slips', 'category' => 'broker_slip_management', 'description' => 'Create new broker slips'],
            ['name' => 'broker_slips.edit', 'display_name' => 'Edit Broker Slips', 'category' => 'broker_slip_management', 'description' => 'Edit broker slip information'],
            ['name' => 'broker_slips.delete', 'display_name' => 'Delete Broker Slips', 'category' => 'broker_slip_management', 'description' => 'Delete broker slips from system'],
            ['name' => 'broker_slips.submit_for_review', 'display_name' => 'Submit for Review', 'category' => 'broker_slip_management', 'description' => 'Submit broker slips for internal review'],
            ['name' => 'broker_slips.approve', 'display_name' => 'Approve Slips', 'category' => 'broker_slip_management', 'description' => 'Approve or reject broker slips'],
            ['name' => 'broker_slips.issue', 'display_name' => 'Issue Slips', 'category' => 'broker_slip_management', 'description' => 'Issue final broker slips'],
            ['name' => 'broker_slips.withdraw', 'display_name' => 'Withdraw Slips', 'category' => 'broker_slip_management', 'description' => 'Withdraw issued broker slips'],

            // Clause Library
            ['name' => 'clause_library.view', 'display_name' => 'View Clause Library', 'category' => 'clause_library', 'description' => 'View clause library entries'],
            ['name' => 'clause_library.create', 'display_name' => 'Create Clauses', 'category' => 'clause_library', 'description' => 'Create new clauses'],
            ['name' => 'clause_library.edit', 'display_name' => 'Edit Clauses', 'category' => 'clause_library', 'description' => 'Edit existing clauses'],
            ['name' => 'clause_library.delete', 'display_name' => 'Delete Clauses', 'category' => 'clause_library', 'description' => 'Delete clauses from library'],
        ];

        foreach ($permissions as $permissionData) {
            Permission::firstOrCreate(
                ['name' => $permissionData['name']],
                ['guard_name' => 'web']
            );
        }
    }

    private function seedTenantRoles(Tenant $tenant): void
    {
        $rolesData = [];

        if ($tenant->type === 'underwriter') {
            $rolesData = [
                [
                    'name' => 'underwriter_admin',
                    'display_name' => 'Underwriter Admin',
                    'description' => 'Full administrative access to underwriter functions',
                    'permissions' => [
                        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
                        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
                        'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.delete', 'quotes.send', 'quotes.convert',
                        'policies.view', 'policies.create', 'policies.edit', 'policies.delete', 'policies.renew', 'policies.cancel',
                        'financial_notes.view', 'financial_notes.create', 'financial_notes.edit', 'financial_notes.delete', 'financial_notes.issue',
                        'reports.view', 'reports.naicom', 'reports.business', 'reports.export',
                        'naicom-reports.view', 'naicom-reports.generate', 'naicom-reports.review', 'naicom-reports.adjust', 'naicom-reports.approve', 'naicom-reports.lock', 'naicom-reports.export', 'naicom-reports.submit', 'naicom-reports.restate',
                        'messages.view', 'messages.send', 'messages.manage',
                        'settings.view', 'settings.edit',
                        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
                        'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete', 'view_tenant_relationships', 'create_tenant_relationships', 'accept_tenant_relationships', 'decline_tenant_relationships', 'remove_tenant_relationships',
                        'placements.view', 'placements.create', 'placements.edit', 'placements.delete', 'placements.submit_to_market', 'placements.convert_to_policy',
                        'markets.view', 'markets.create', 'markets.edit', 'markets.delete', 'markets.respond',
                        'broker_slips.view', 'broker_slips.create', 'broker_slips.edit', 'broker_slips.delete', 'broker_slips.submit_for_review', 'broker_slips.approve', 'broker_slips.issue', 'broker_slips.withdraw',
                        'clause_library.view', 'clause_library.create', 'clause_library.edit', 'clause_library.delete',
                    ],
                ],
                [
                    'name' => 'underwriter_staff',
                    'display_name' => 'Underwriter Staff',
                    'description' => 'Standard underwriter staff with policy management access',
                    'permissions' => [
                        'customers.view', 'customers.create', 'customers.edit',
                        'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.send', 'quotes.convert',
                        'policies.view', 'policies.create', 'policies.edit', 'policies.renew',
                        'financial_notes.view', 'financial_notes.create', 'financial_notes.edit', 'financial_notes.issue',
                        'reports.view', 'reports.business',
                        'naicom-reports.view', 'naicom-reports.generate',
                        'messages.view', 'messages.send',
                        'view_tenant_relationships',
                        'placements.view', 'placements.create', 'placements.edit', 'placements.submit_to_market',
                        'markets.view', 'markets.create', 'markets.edit', 'markets.respond',
                        'broker_slips.view', 'broker_slips.create', 'broker_slips.edit', 'broker_slips.submit_for_review',
                        'clause_library.view', 'clause_library.create', 'clause_library.edit',
                    ],
                ],
            ];
        } elseif ($tenant->type === 'broker') {
            $rolesData = [
                [
                    'name' => 'broker_admin',
                    'display_name' => 'Broker Admin',
                    'description' => 'Full administrative access to broker functions',
                    'permissions' => [
                        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles',
                        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
                        'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.delete', 'quotes.send',
                        'policies.view', 'policies.edit',
                        'financial_notes.view',
                        'reports.view', 'reports.business', 'reports.export',
                        'naicom-reports.view', 'naicom-reports.generate', 'naicom-reports.review', 'naicom-reports.adjust', 'naicom-reports.approve', 'naicom-reports.lock', 'naicom-reports.export', 'naicom-reports.submit', 'naicom-reports.restate',
                        'messages.view', 'messages.send', 'messages.manage',
                        'settings.view', 'settings.edit',
                        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
                        'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete', 'view_tenant_relationships', 'create_tenant_relationships', 'accept_tenant_relationships', 'decline_tenant_relationships', 'remove_tenant_relationships',
                        'placements.view', 'placements.create', 'placements.edit', 'placements.delete', 'placements.submit_to_market',
                        'markets.view', 'markets.create', 'markets.edit', 'markets.delete', 'markets.respond',
                        'broker_slips.view', 'broker_slips.create', 'broker_slips.edit', 'broker_slips.delete', 'broker_slips.submit_for_review', 'broker_slips.issue', 'broker_slips.withdraw',
                        'clause_library.view', 'clause_library.create', 'clause_library.edit', 'clause_library.delete',
                    ],
                ],
                [
                    'name' => 'broker_staff',
                    'display_name' => 'Broker Staff',
                    'description' => 'Standard broker staff with limited access',
                    'permissions' => [
                        'customers.view', 'customers.create', 'customers.edit',
                        'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.send',
                        'policies.view',
                        'financial_notes.view',
                        'reports.view',
                        'naicom-reports.view', 'naicom-reports.generate',
                        'messages.view', 'messages.send',
                        'view_tenant_relationships',
                        'placements.view', 'placements.create', 'placements.edit',
                        'markets.view',
                        'broker_slips.view', 'broker_slips.create', 'broker_slips.edit',
                        'clause_library.view',
                    ],
                ],
            ];
        }

        foreach ($rolesData as $roleData) {
            $role = Role::firstOrCreate(
                ['name' => $roleData['name']],
                ['guard_name' => 'web']
            );

            // Assign permissions to role
            $permissions = Permission::whereIn('name', $roleData['permissions'])->get();
            $role->syncPermissions($permissions);
        }
    }
}
