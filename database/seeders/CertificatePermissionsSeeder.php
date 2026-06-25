<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CertificatePermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Define certificate permissions with both underscore and hyphen formats
        $certificatePermissions = [
            // Certificate Module Permissions (underscore format for sidebar)
            'generate_certificates' => 'Generate certificates from policies',
            'download_certificates' => 'Download certificate PDFs',
            'issue_certificates' => 'Issue certificates to customers',
            'cancel_certificates' => 'Cancel issued certificates',
            'regenerate_certificates' => 'Regenerate existing certificates',
            'view_certificate_settings' => 'View certificate configuration settings',
            'manage_certificate_settings' => 'Manage certificate templates and settings',
            'upload_certificate_assets' => 'Upload logos and signature stamps',
            'verify_certificates' => 'Verify certificate authenticity',
            'bulk_generate_certificates' => 'Generate multiple certificates at once',

            // Certificate Module Permissions (hyphen format for gates)
            'view-certificates' => 'View certificate list and details',
            'generate-certificates' => 'Generate certificates from policies',
            'download-certificate' => 'Download certificate PDFs',
            'issue-certificate' => 'Issue certificates to customers',
            'cancel-certificate' => 'Cancel issued certificates',
            'regenerate-certificate' => 'Regenerate existing certificates',
            'view-certificate' => 'View individual certificate details',
            'manage-certificate-settings' => 'Manage certificate templates and settings',
            'bulk-generate-certificates' => 'Generate multiple certificates at once',

            // Certificate Template Permissions
            'view_certificate_templates' => 'View certificate templates',
            'create_certificate_templates' => 'Create new certificate templates',
            'edit_certificate_templates' => 'Edit existing certificate templates',
            'delete_certificate_templates' => 'Delete certificate templates',
            'duplicate_certificate_templates' => 'Duplicate certificate templates',
            'export_certificate_templates' => 'Export certificate templates',
            'import_certificate_templates' => 'Import certificate templates',
            'manage_certificate_templates' => 'Full access to certificate template management',

            // Individual template permissions (for gates)
            'view_certificate_template' => 'View individual certificate template',
            'edit_certificate_template' => 'Edit individual certificate template',
            'delete_certificate_template' => 'Delete individual certificate template',
        ];

        // Additional missing permissions for other modules
        $additionalPermissions = [
            // Invoice & Receipt permissions (if missing)
            'view_invoices' => 'View customer invoices',
            'create_invoices' => 'Create new invoices',
            'download_invoices' => 'Download invoice PDFs',
            'view_receipts' => 'View payment receipts',
            'create_receipts' => 'Create payment receipts',
            'download_receipts' => 'Download receipt PDFs',

            // Additional message permissions
            'reply_to_messages' => 'Reply to messages',
            'mark_messages_read' => 'Mark messages as read/unread',
            'bulk_delete_messages' => 'Delete multiple messages',
            'download_message_attachments' => 'Download message attachments',

            // Additional renewal permissions
            'send_renewal_reminders' => 'Send renewal reminder emails',
            'manage_renewal_settings' => 'Configure renewal settings',

            // Additional financial note permissions
            'mark_financial_notes_paid' => 'Mark debit/credit notes as paid',
            'bulk_financial_notes_actions' => 'Bulk actions on financial notes',
        ];

        // Combine all permissions
        $allPermissions = array_merge($certificatePermissions, $additionalPermissions);

        // Create permissions that don't exist
        $createdCount = 0;
        foreach ($allPermissions as $permission => $description) {
            $created = Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
            if ($created->wasRecentlyCreated) {
                $createdCount++;
            }
        }

        $this->command->info("Created {$createdCount} new permissions.");

        // Get tenant roles that should have full access to certificates
        $tenantRoles = [
            'underwriter',
            'broker',
            'underwriter_staff',
            'broker_staff',
        ];

        // Give tenant roles access to certificate permissions
        foreach ($tenantRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                // Add certificate permissions to the role
                foreach (array_keys($allPermissions) as $permission) {
                    $permissionModel = Permission::where('name', $permission)->first();
                    if ($permissionModel && ! $role->hasPermissionTo($permission)) {
                        $role->givePermissionTo($permission);
                    }
                }
                $this->command->info("Updated permissions for role: {$roleName}");
            } else {
                $this->command->warn("Role not found: {$roleName}");
            }
        }

        // Ensure customer role has read-only access to relevant features
        $customerRole = Role::where('name', 'customer')->first();
        if ($customerRole) {
            $customerPermissions = [
                'view_certificates',
                'download_certificates',
                'verify_certificates',
                'view_policies',
                'download_policies',
                'view_invoices',
                'download_invoices',
                'view_receipts',
                'download_receipts',
                'view_messages',
                'reply_to_messages',
            ];

            foreach ($customerPermissions as $permission) {
                $permissionModel = Permission::where('name', $permission)->first();
                if ($permissionModel && ! $customerRole->hasPermissionTo($permission)) {
                    $customerRole->givePermissionTo($permission);
                }
            }
            $this->command->info('Updated customer permissions');
        }

        $this->command->info('Certificate permission seeding completed successfully!');
    }
}
