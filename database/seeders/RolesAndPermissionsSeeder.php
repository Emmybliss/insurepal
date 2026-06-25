<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permission modules with detailed metadata
        $permissionModules = [
            'Customer Management' => [
                'permissions' => [
                    'view_customers' => 'View customer profiles and details',
                    'create_customers' => 'Create new customer accounts',
                    'edit_customers' => 'Edit customer information',
                    'delete_customers' => 'Delete customer accounts',
                    'import_customers' => 'Bulk import customers from CSV/Excel',
                    'export_customers' => 'Export customer data',
                ],
            ],
            'Quote Management' => [
                'permissions' => [
                    'view_quotes' => 'View insurance quotes',
                    'create_quotes' => 'Create new quotes',
                    'edit_quotes' => 'Edit existing quotes',
                    'delete_quotes' => 'Delete quotes',
                    'approve_quotes' => 'Approve quotes for conversion',
                    'convert_quotes' => 'Convert quotes to policies',
                    'send_quotes' => 'Send quotes to customers',
                    'duplicate_quotes' => 'Duplicate existing quotes',
                ],
            ],
            'Policy Management' => [
                'permissions' => [
                    'view_policies' => 'View insurance policies',
                    'create_policies' => 'Create new policies',
                    'edit_policies' => 'Edit policy details',
                    'delete_policies' => 'Delete policies',
                    'renew_policies' => 'Process policy renewals',
                    'cancel_policies' => 'Cancel active policies',
                    'reinstate_policies' => 'Reinstate cancelled policies',
                    'endorse_policies' => 'Create policy endorsements',
                ],
            ],
            'Financial Management' => [
                'permissions' => [
                    'view_financial_notes' => 'View debit and credit notes',
                    'create_debit_notes' => 'Create debit notes',
                    'create_credit_notes' => 'Create credit notes',
                    'edit_financial_notes' => 'Edit financial notes',
                    'delete_financial_notes' => 'Delete financial notes',
                    'approve_financial_notes' => 'Approve financial transactions',
                    'process_payments' => 'Process customer payments',
                    'manage_commissions' => 'Manage broker commissions',
                ],
            ],
            'Reports & Analytics' => [
                'permissions' => [
                    'view_reports' => 'View business reports',
                    'generate_reports' => 'Generate custom reports',
                    'export_reports' => 'Export reports to PDF/Excel',
                    'view_analytics' => 'Access analytics dashboard',
                    'view_naicom_reports' => 'View NAICOM compliance reports',
                    'submit_naicom_reports' => 'Submit regulatory reports',
                    'naicom-reports.view' => 'View NAICOM Form 7.2 reports',
                    'naicom-reports.generate' => 'Generate NAICOM Form 7.2 reports',
                    'naicom-reports.review' => 'Review NAICOM compliance reports',
                    'naicom-reports.adjust' => 'Adjust NAICOM report data',
                    'naicom-reports.approve' => 'Approve NAICOM compliance reports',
                    'naicom-reports.lock' => 'Lock NAICOM reports against changes',
                    'naicom-reports.export' => 'Export NAICOM reports to Excel',
                    'naicom-reports.submit' => 'Submit NAICOM regulatory reports',
                    'naicom-reports.restate' => 'Restate NAICOM reports',
                ],
            ],
            'User Management' => [
                'permissions' => [
                    'view_users' => 'View staff and users',
                    'create_users' => 'Create new user accounts',
                    'edit_users' => 'Edit user profiles',
                    'delete_users' => 'Delete user accounts',
                    'manage_roles' => 'Assign and manage user roles',
                    'invite_users' => 'Send user invitations',
                    'reset_passwords' => 'Reset user passwords',
                ],
            ],
            'Settings Management' => [
                'permissions' => [
                    'view_settings' => 'View system settings',
                    'edit_settings' => 'Edit company settings',
                    'manage_integrations' => 'Configure third-party integrations',
                    'manage_email_templates' => 'Customize email templates',
                    'manage_pdf_templates' => 'Customize PDF document templates',
                    'manage_product_settings' => 'Configure insurance products',
                    'manage_certificate_settings' => 'Configure certificate settings and templates',
                ],
            ],
            'Document Templates' => [
                'permissions' => [
                    'view_document_templates' => 'View document templates',
                    'create_document_templates' => 'Create new document templates',
                    'edit_document_templates' => 'Edit document templates',
                    'delete_document_templates' => 'Delete document templates',
                    'manage_document_templates' => 'Full management of document templates',
                ],
            ],
            'Certificate Management' => [
                'permissions' => [
                    'view_certificate_templates' => 'View certificate templates',
                    'create_certificate_templates' => 'Create certificate templates',
                    'edit_certificate_templates' => 'Edit certificate templates',
                    'delete_certificate_templates' => 'Delete certificate templates',
                    'manage_certificate_templates' => 'Full management of certificate templates',
                    'generate_certificates' => 'Generate certificates from templates',
                    'view_certificates' => 'View generated certificates',
                    'download_certificates' => 'Download certificates',
                    'issue_certificates' => 'Issue certificates to customers',
                    'cancel_certificates' => 'Cancel issued certificates',
                    'regenerate_certificates' => 'Regenerate existing certificates',
                    'bulk_generate_certificates' => 'Bulk generate multiple certificates',
                ],
            ],
            'Communication' => [
                'permissions' => [
                    'view_messages' => 'View inbox messages',
                    'send_messages' => 'Send internal messages',
                    'delete_messages' => 'Delete messages',
                    'manage_notifications' => 'Configure notification settings',
                    'broadcast_messages' => 'Send broadcast messages',
                ],
            ],
            'Super Admin' => [
                'permissions' => [
                    'manage_tenants' => 'Manage tenant accounts',
                    'view_platform_analytics' => 'View platform-wide analytics',
                    'manage_system_settings' => 'Configure global system settings',
                    'manage_subscriptions' => 'Handle subscription billing',
                    'access_telescope' => 'Access Laravel Telescope',
                    'manage_backups' => 'Manage system backups',
                ],
            ],
            'Claim Management' => [
                'permissions' => [
                    'view_claims' => 'View insurance claims',
                    'create_claims' => 'Create new claims',
                    'edit_claims' => 'Edit claim details',
                    'delete_claims' => 'Delete claims',
                    'review_claims' => 'Review and process claims',
                    'approve_claims' => 'Approve or reject claims',
                    'settle_claims' => 'Settle and close claims',
                ],
            ],
            'Renewals Management' => [
                'permissions' => [
                    'view_renewals' => 'View renewal pipeline',
                    'process_renewals' => 'Process policy renewals',
                    'schedule_reminders' => 'Schedule renewal reminders',
                    'manage_renewal_rates' => 'Configure renewal pricing',
                ],
            ],
            'Broker Management' => [
                'permissions' => [
                    'view_brokers' => 'View broker profiles and details',
                    'create_brokers' => 'Create new broker accounts',
                    'edit_brokers' => 'Edit broker information',
                    'delete_brokers' => 'Delete broker accounts',
                    'manage_broker_status' => 'Activate/suspend broker accounts',
                    'view_broker_analytics' => 'View broker performance analytics',
                ],
            ],
            'Recycle Bin' => [
                'permissions' => [
                    'recycle_bin_view' => 'View recycle bin',
                    'recycle_bin_restore' => 'Restore deleted records',
                    'recycle_bin_force_delete' => 'Permanently delete records',
                ],
            ],
        ];

        // Create permissions with module grouping
        foreach ($permissionModules as $moduleName => $module) {
            foreach ($module['permissions'] as $permissionName => $description) {
                Permission::firstOrCreate(
                    ['name' => $permissionName],
                    [
                        'tenant_id' => null, // System-wide permissions
                        'category' => $moduleName,
                        'label' => ucwords(str_replace('_', ' ', $permissionName)),
                        'description' => $description,
                        'is_active' => true,
                        'is_system_permission' => true,
                        'guard_name' => 'web',
                    ]
                );
            }
        }

        // Define roles with detailed configuration
        $roles = [
            'super_admin' => [
                'label' => 'Super Administrator',
                'description' => 'Platform owner with full system access',
                'permissions' => 'all',
            ],
            'underwriter' => [
                'label' => 'Underwriter',
                'description' => 'Insurance underwriter with full tenant access',
                'permissions' => [
                    'view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'import_customers', 'export_customers',
                    'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes', 'approve_quotes', 'convert_quotes', 'send_quotes', 'duplicate_quotes',
                    'view_policies', 'create_policies', 'edit_policies', 'delete_policies', 'renew_policies', 'cancel_policies', 'reinstate_policies', 'endorse_policies',
                    'view_financial_notes', 'create_debit_notes', 'create_credit_notes', 'edit_financial_notes', 'delete_financial_notes', 'approve_financial_notes', 'process_payments', 'manage_commissions',
                    'view_reports', 'generate_reports', 'export_reports', 'view_analytics', 'view_naicom_reports', 'submit_naicom_reports',
                    'naicom-reports.view', 'naicom-reports.generate', 'naicom-reports.review', 'naicom-reports.adjust', 'naicom-reports.approve', 'naicom-reports.lock', 'naicom-reports.export', 'naicom-reports.submit', 'naicom-reports.restate',
                    'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'invite_users', 'reset_passwords',
                    'view_settings', 'edit_settings', 'manage_integrations', 'manage_email_templates', 'manage_pdf_templates', 'manage_product_settings', 'manage_certificate_settings',
                    'view_document_templates', 'create_document_templates', 'edit_document_templates', 'delete_document_templates', 'manage_document_templates',
                    'view_certificate_templates', 'create_certificate_templates', 'edit_certificate_templates', 'delete_certificate_templates', 'manage_certificate_templates',
                    'generate_certificates', 'view_certificates', 'download_certificates', 'issue_certificates', 'cancel_certificates', 'regenerate_certificates', 'bulk_generate_certificates',
                    'view_messages', 'send_messages', 'delete_messages', 'manage_notifications', 'broadcast_messages',
                    'view_renewals', 'process_renewals', 'schedule_reminders', 'manage_renewal_rates',
                    'view_brokers', 'create_brokers', 'edit_brokers', 'delete_brokers', 'manage_broker_status', 'view_broker_analytics',
                    'view_claims', 'create_claims', 'edit_claims', 'delete_claims', 'review_claims', 'approve_claims', 'settle_claims',
                    'recycle_bin_view', 'recycle_bin_restore',
                ],
            ],
            'broker' => [
                'label' => 'Broker',
                'description' => 'Insurance broker with tenant management capabilities',
                'permissions' => [
                    'view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'import_customers', 'export_customers',
                    'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes', 'send_quotes', 'duplicate_quotes',
                    'view_policies', 'create_policies', 'edit_policies', 'renew_policies', 'endorse_policies',
                    'view_financial_notes', 'create_debit_notes', 'create_credit_notes', 'edit_financial_notes', 'process_payments',
                    'view_reports', 'generate_reports', 'export_reports', 'view_analytics',
                    'naicom-reports.view', 'naicom-reports.generate', 'naicom-reports.review', 'naicom-reports.adjust', 'naicom-reports.approve', 'naicom-reports.lock', 'naicom-reports.export', 'naicom-reports.submit', 'naicom-reports.restate',
                    'view_users', 'create_users', 'edit_users', 'invite_users',
                    'view_settings', 'edit_settings', 'manage_email_templates', 'manage_pdf_templates', 'manage_certificate_settings',
                    'view_document_templates', 'create_document_templates', 'edit_document_templates', 'delete_document_templates', 'manage_document_templates',
                    'view_certificate_templates', 'create_certificate_templates', 'edit_certificate_templates', 'delete_certificate_templates', 'manage_certificate_templates',
                    'generate_certificates', 'view_certificates', 'download_certificates', 'issue_certificates', 'cancel_certificates', 'regenerate_certificates', 'bulk_generate_certificates',
                    'view_messages', 'send_messages', 'manage_notifications',
                    'view_renewals', 'process_renewals', 'schedule_reminders',
                    'view_claims', 'create_claims', 'edit_claims', 'delete_claims', 'review_claims', 'approve_claims', 'settle_claims',
                    'recycle_bin_view', 'recycle_bin_restore',
                ],
            ],
            'underwriter_staff' => [
                'label' => 'Underwriter Staff',
                'description' => 'Underwriter staff member with operational access',
                'permissions' => [
                    'view_customers', 'create_customers', 'edit_customers',
                    'view_quotes', 'create_quotes', 'edit_quotes', 'send_quotes',
                    'view_policies', 'create_policies', 'edit_policies', 'renew_policies',
                    'view_financial_notes', 'create_debit_notes', 'create_credit_notes',
                    'view_reports', 'generate_reports', 'export_reports',
                    'naicom-reports.view', 'naicom-reports.generate',
                    'view_document_templates', 'create_document_templates', 'edit_document_templates',
                    'view_certificate_templates', 'create_certificate_templates', 'edit_certificate_templates',
                    'generate_certificates', 'view_certificates', 'download_certificates',
                    'view_messages', 'send_messages',
                    'view_renewals', 'process_renewals',
                    'recycle_bin_view',
                ],
            ],
            'broker_staff' => [
                'label' => 'Broker Staff',
                'description' => 'Broker staff member with limited operational access',
                'permissions' => [
                    'view_customers', 'create_customers', 'edit_customers',
                    'view_quotes', 'create_quotes', 'edit_quotes', 'send_quotes',
                    'view_policies', 'edit_policies', 'renew_policies',
                    'view_financial_notes', 'create_debit_notes',
                    'view_reports', 'export_reports',
                    'naicom-reports.view', 'naicom-reports.generate',
                    'view_document_templates', 'create_document_templates', 'edit_document_templates',
                    'view_certificate_templates', 'create_certificate_templates', 'edit_certificate_templates',
                    'generate_certificates', 'view_certificates', 'download_certificates',
                    'view_messages', 'send_messages',
                    'view_renewals',
                    'recycle_bin_view',
                ],
            ],
            'customer' => [
                'label' => 'Customer',
                'description' => 'End customer with self-service portal access',
                'permissions' => [
                    'view_policies',
                    'view_quotes',
                    'view_financial_notes',
                    'view_certificates',
                    'download_certificates',
                    'view_messages',
                    'view_renewals',
                    'view_claims',
                    'create_claims',
                    'edit_claims',
                ],
            ],
        ];

        // Create roles and assign permissions
        foreach ($roles as $roleName => $roleConfig) {
            $role = Role::firstOrCreate(
                ['name' => $roleName],
                [
                    'tenant_id' => null, // System-wide roles
                    'label' => $roleConfig['label'],
                    'description' => $roleConfig['description'],
                    'is_active' => true,
                    'is_system_role' => true,
                    'guard_name' => 'web',
                ]
            );

            // Assign permissions
            if ($roleConfig['permissions'] === 'all') {
                $role->givePermissionTo(Permission::all());
            } else {
                $role->syncPermissions($roleConfig['permissions']);
            }
        }

        $this->command->info('Roles and permissions seeded successfully!');
        $this->command->info('Created '.Permission::count().' permissions and '.Role::count().' roles.');
    }
}
