<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ComprehensivePermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Define all permissions that are checked in the sidebar and controllers
        $permissions = [
            // Customer Management
            'view_customers' => 'View customer list and details',
            'create_customers' => 'Create new customers',
            'edit_customers' => 'Edit customer information',
            'delete_customers' => 'Delete customers',

            // Quote Management
            'view_quotes' => 'View quote list and details',
            'create_quotes' => 'Create new quotes',
            'edit_quotes' => 'Edit quotes',
            'delete_quotes' => 'Delete quotes',
            'approve_quotes' => 'Approve quotes',

            // Policy Management
            'view_policies' => 'View policy list and details',
            'create_policies' => 'Create new policies',
            'edit_policies' => 'Edit policies',
            'delete_policies' => 'Delete policies',
            'approve_policies' => 'Approve policies',
            'renew_policies' => 'Renew policies',

            // Certificate Management
            'view_certificates' => 'View certificate list and details',
            'generate_certificates' => 'Generate certificates from policies',
            'download_certificates' => 'Download certificate PDFs',
            'manage_certificate_templates' => 'Manage certificate templates',
            'view_certificate_templates' => 'View certificate templates',
            'create_certificate_templates' => 'Create certificate templates',
            'edit_certificate_templates' => 'Edit certificate templates',
            'delete_certificate_templates' => 'Delete certificate templates',
            'manage_certificate_settings' => 'Manage certificate settings',

            // Financial Management
            'view_financial_notes' => 'View financial notes (debit/credit)',
            'create_financial_notes' => 'Create financial notes',
            'edit_financial_notes' => 'Edit financial notes',
            'delete_financial_notes' => 'Delete financial notes',
            'mark_financial_notes_paid' => 'Mark financial notes as paid',

            // Messages & Communication
            'view_messages' => 'View messages and communication',
            'create_messages' => 'Send new messages',
            'reply_to_messages' => 'Reply to messages',
            'delete_messages' => 'Delete messages',
            'mark_messages_read' => 'Mark messages as read/unread',

            // Reports & Analytics
            'view_reports' => 'View reports and analytics',
            'generate_reports' => 'Generate custom reports',
            'export_reports' => 'Export reports to various formats',

            // User Management
            'view_users' => 'View user list and details',
            'create_users' => 'Create new users',
            'edit_users' => 'Edit user information',
            'delete_users' => 'Delete users',

            // Role & Permission Management
            'manage_roles' => 'Manage roles and permissions',
            'assign_roles' => 'Assign roles to users',
            'view_permissions' => 'View permissions',

            // Broker Management (for underwriters)
            'view_brokers' => 'View broker list and details',
            'create_brokers' => 'Create new brokers',
            'edit_brokers' => 'Edit broker information',
            'delete_brokers' => 'Delete brokers',

            // Settings
            'view_settings' => 'View application settings',
            'edit_settings' => 'Edit application settings',
            'manage_system_settings' => 'Manage system-wide settings',

            // Tenant Management (super admin only)
            'manage_tenants' => 'Manage tenant accounts',
            'view_analytics' => 'View system analytics',

            // Renewal Management
            'view_renewals' => 'View policy renewals',
            'process_renewals' => 'Process policy renewals',
            'send_renewal_reminders' => 'Send renewal reminder emails',

            // Claims Management
            'view_claims' => 'View claims',
            'create_claims' => 'Create new claims',
            'edit_claims' => 'Edit claims',
            'delete_claims' => 'Delete claims',
            'review_claims' => 'Review and process claims',
            'approve_claims' => 'Approve or reject claims',
            'settle_claims' => 'Settle and close claims',

            // Tenant Relationship Management
            'view_tenant_relationships' => 'View tenant relationships',
            'create_tenant_relationships' => 'Create tenant relationships',
            'accept_tenant_relationships' => 'Accept tenant relationship requests',
            'decline_tenant_relationships' => 'Decline tenant relationship requests',
            'remove_tenant_relationships' => 'Remove tenant relationships',

            // Support System
            'view_support_tickets' => 'View support tickets',
            'create_support_tickets' => 'Create support tickets',
            'edit_support_tickets' => 'Edit support tickets',
            'delete_support_tickets' => 'Delete support tickets',
            'assign_tickets' => 'Assign support tickets',
            'resolve_tickets' => 'Resolve support tickets',
            'close_tickets' => 'Close support tickets',
            'view_all_tickets' => 'View all support tickets',
            'escalate_tickets' => 'Escalate support tickets',
            'view_kb_articles' => 'View knowledge base articles',
            'create_kb_articles' => 'Create knowledge base articles',
            'edit_kb_articles' => 'Edit knowledge base articles',
            'delete_kb_articles' => 'Delete knowledge base articles',
            'publish_kb_articles' => 'Publish knowledge base articles',
            'archive_kb_articles' => 'Archive knowledge base articles',
            'manage_kb_categories' => 'Manage knowledge base categories',
            'view_kb_analytics' => 'View knowledge base analytics',

            // Additional Document Template Permissions
            'duplicate_document_templates' => 'Duplicate document templates',
            'export_document_templates' => 'Export document templates',
            'import_document_templates' => 'Import document templates',
            'view_document_template' => 'View individual document template',
            'edit_document_template' => 'Edit individual document template',
            'delete_document_template' => 'Delete individual document template',
            'preview_document_template' => 'Preview document template',
            'generate_documents_from_templates' => 'Generate documents from templates',
            'customize_document_templates' => 'Customize document template designs',
            'manage_template_placeholders' => 'Manage template placeholder fields',
            'set_default_templates' => 'Set default templates for document types',

            // Additional Certificate Permissions
            'duplicate_certificate_templates' => 'Duplicate certificate templates',
            'export_certificate_templates' => 'Export certificate templates',
            'import_certificate_templates' => 'Import certificate templates',
            'view_certificate_template' => 'View individual certificate template',
            'edit_certificate_template' => 'Edit individual certificate template',
            'delete_certificate_template' => 'Delete individual certificate template',
            'upload_certificate_assets' => 'Upload certificate assets',
            'verify_certificates' => 'Verify certificate authenticity',

            // Additional Financial Permissions
            'create_debit_notes' => 'Create debit notes',
            'create_credit_notes' => 'Create credit notes',
            'approve_financial_notes' => 'Approve financial transactions',
            'process_payments' => 'Process customer payments',
            'manage_commissions' => 'Manage broker commissions',
            'mark_financial_notes_paid' => 'Mark financial notes as paid',
            'bulk_financial_notes_actions' => 'Bulk actions on financial notes',

            // Additional Invoice & Receipt Permissions
            'view_invoices' => 'View customer invoices',
            'create_invoices' => 'Create new invoices',
            'download_invoices' => 'Download invoice PDFs',
            'view_receipts' => 'View payment receipts',
            'create_receipts' => 'Create payment receipts',
            'download_receipts' => 'Download receipt PDFs',

            // Additional Message Permissions
            'send_messages' => 'Send messages',
            'reply_to_messages' => 'Reply to messages',
            'mark_messages_read' => 'Mark messages as read/unread',
            'bulk_delete_messages' => 'Delete multiple messages',
            'download_message_attachments' => 'Download message attachments',
            'manage_notifications' => 'Configure notification settings',
            'broadcast_messages' => 'Send broadcast messages',

            // Additional Renewal Permissions
            'schedule_reminders' => 'Schedule renewal reminders',
            'manage_renewal_rates' => 'Configure renewal pricing',
            'manage_renewal_settings' => 'Configure renewal settings',

            // Additional Broker Management Permissions
            'manage_broker_status' => 'Activate/suspend broker accounts',
            'view_broker_analytics' => 'View broker performance analytics',

            // Additional User Management Permissions
            'import_customers' => 'Bulk import customers',
            'export_customers' => 'Export customer data',
            'invite_users' => 'Send user invitations',
            'reset_passwords' => 'Reset user passwords',

            // Additional Quote Permissions
            'convert_quotes' => 'Convert quotes to policies',
            'send_quotes' => 'Send quotes to customers',
            'duplicate_quotes' => 'Duplicate existing quotes',

            // Additional Policy Permissions
            'cancel_policies' => 'Cancel active policies',
            'reinstate_policies' => 'Reinstate cancelled policies',
            'endorse_policies' => 'Create policy endorsements',

            // Additional Settings Permissions
            'manage_integrations' => 'Configure third-party integrations',
            'manage_email_templates' => 'Customize email templates',
            'manage_pdf_templates' => 'Customize PDF document templates',
            'manage_product_settings' => 'Configure insurance products',

            // Additional Reports Permissions
            'view_naicom_reports' => 'View NAICOM compliance reports',
            'submit_naicom_reports' => 'Submit regulatory reports',
        ];

        // Create permissions that don't exist
        $createdCount = 0;
        foreach ($permissions as $permission => $description) {
            $created = Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
            if ($created->wasRecentlyCreated) {
                $createdCount++;
            }
        }

        $this->command->info("Created {$createdCount} new permissions.");

        // Define role permissions mapping
        $rolePermissions = [
            'super_admin' => array_keys($permissions), // Super admin gets all permissions

            'underwriter' => [
                'view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'import_customers', 'export_customers',
                'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes', 'approve_quotes', 'convert_quotes', 'send_quotes', 'duplicate_quotes',
                'view_policies', 'create_policies', 'edit_policies', 'delete_policies', 'approve_policies', 'renew_policies', 'cancel_policies', 'reinstate_policies', 'endorse_policies',
                'view_certificates', 'generate_certificates', 'download_certificates', 'manage_certificate_templates', 'verify_certificates', 'bulk_generate_certificates',
                'view_certificate_templates', 'create_certificate_templates', 'edit_certificate_templates', 'delete_certificate_templates', 'manage_certificate_settings',
                'duplicate_certificate_templates', 'export_certificate_templates', 'import_certificate_templates', 'upload_certificate_assets',
                'view_financial_notes', 'create_financial_notes', 'edit_financial_notes', 'delete_financial_notes', 'mark_financial_notes_paid',
                'create_debit_notes', 'create_credit_notes', 'approve_financial_notes', 'process_payments', 'manage_commissions', 'bulk_financial_notes_actions',
                'view_invoices', 'create_invoices', 'download_invoices', 'view_receipts', 'create_receipts', 'download_receipts',
                'view_messages', 'create_messages', 'reply_to_messages', 'delete_messages', 'mark_messages_read', 'send_messages',
                'bulk_delete_messages', 'download_message_attachments', 'manage_notifications', 'broadcast_messages',
                'view_reports', 'generate_reports', 'export_reports', 'view_naicom_reports', 'submit_naicom_reports',
                'view_users', 'create_users', 'edit_users', 'delete_users', 'invite_users', 'reset_passwords',
                'manage_roles', 'assign_roles', 'view_permissions',
                'view_brokers', 'create_brokers', 'edit_brokers', 'delete_brokers', 'manage_broker_status', 'view_broker_analytics',
                'view_settings', 'edit_settings', 'manage_integrations', 'manage_email_templates', 'manage_pdf_templates', 'manage_product_settings',
                'view_renewals', 'process_renewals', 'send_renewal_reminders', 'schedule_reminders', 'manage_renewal_rates', 'manage_renewal_settings',
                'view_claims', 'create_claims', 'edit_claims', 'delete_claims', 'review_claims', 'approve_claims', 'settle_claims',
                'view_tenant_relationships', 'create_tenant_relationships', 'accept_tenant_relationships', 'decline_tenant_relationships', 'remove_tenant_relationships',
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets', 'delete_support_tickets', 'assign_tickets', 'resolve_tickets', 'close_tickets', 'view_all_tickets', 'escalate_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles', 'delete_kb_articles', 'publish_kb_articles', 'archive_kb_articles', 'manage_kb_categories', 'view_kb_analytics',
                'view_document_templates', 'create_document_templates', 'edit_document_templates', 'delete_document_templates', 'manage_document_templates',
                'duplicate_document_templates', 'export_document_templates', 'import_document_templates', 'preview_document_template',
                'generate_documents_from_templates', 'customize_document_templates', 'manage_template_placeholders', 'set_default_templates',
            ],

            'broker' => [
                'view_customers', 'create_customers', 'edit_customers', 'delete_customers', 'import_customers', 'export_customers',
                'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes', 'send_quotes', 'duplicate_quotes',
                'view_policies', 'create_policies', 'edit_policies', 'renew_policies', 'endorse_policies',
                'view_certificates', 'generate_certificates', 'download_certificates', 'manage_certificate_templates', 'verify_certificates', 'bulk_generate_certificates',
                'view_certificate_templates', 'create_certificate_templates', 'edit_certificate_templates', 'delete_certificate_templates', 'manage_certificate_settings',
                'duplicate_certificate_templates', 'export_certificate_templates', 'import_certificate_templates', 'upload_certificate_assets',
                'view_financial_notes', 'create_financial_notes', 'edit_financial_notes', 'delete_financial_notes',
                'create_debit_notes', 'create_credit_notes', 'process_payments', 'bulk_financial_notes_actions',
                'view_invoices', 'create_invoices', 'download_invoices', 'view_receipts', 'create_receipts', 'download_receipts',
                'view_messages', 'create_messages', 'reply_to_messages', 'delete_messages', 'mark_messages_read', 'send_messages',
                'bulk_delete_messages', 'download_message_attachments', 'manage_notifications',
                'view_reports', 'generate_reports', 'export_reports',
                'view_users', 'create_users', 'edit_users', 'delete_users', 'invite_users',
                'manage_roles', 'assign_roles', 'view_permissions',
                'view_settings', 'edit_settings', 'manage_email_templates', 'manage_pdf_templates', 'manage_product_settings',
                'view_renewals', 'process_renewals', 'send_renewal_reminders', 'schedule_reminders',
                'view_claims', 'create_claims', 'edit_claims', 'delete_claims',
                'view_tenant_relationships', 'create_tenant_relationships', 'accept_tenant_relationships', 'decline_tenant_relationships', 'remove_tenant_relationships',
                'view_conversations', 'create_conversations', 'edit_conversations', 'delete_conversations', 'view_all_conversations', 'assign_conversations',
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets', 'delete_support_tickets', 'assign_tickets', 'resolve_tickets', 'close_tickets', 'view_all_tickets', 'escalate_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles', 'delete_kb_articles', 'publish_kb_articles', 'archive_kb_articles', 'manage_kb_categories', 'view_kb_analytics',
                'access_live_chat', 'accept_chat_requests', 'transfer_chats', 'manage_chat_queues', 'view_chat_analytics',
                'view_document_templates', 'create_document_templates', 'edit_document_templates', 'delete_document_templates', 'manage_document_templates',
                'duplicate_document_templates', 'export_document_templates', 'import_document_templates', 'preview_document_template',
                'generate_documents_from_templates', 'customize_document_templates', 'manage_template_placeholders', 'set_default_templates',
            ],

            'underwriter_admin' => [
                'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
                'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes', 'approve_quotes',
                'view_policies', 'create_policies', 'edit_policies', 'delete_policies', 'approve_policies', 'renew_policies',
                'view_certificates', 'generate_certificates', 'download_certificates', 'manage_certificate_templates',
                'view_certificate_templates', 'create_certificate_templates', 'edit_certificate_templates', 'delete_certificate_templates', 'manage_certificate_settings',
                'view_financial_notes', 'create_financial_notes', 'edit_financial_notes', 'delete_financial_notes', 'mark_financial_notes_paid',
                'view_messages', 'create_messages', 'reply_to_messages', 'delete_messages', 'mark_messages_read',
                'view_reports', 'generate_reports', 'export_reports',
                'view_users', 'create_users', 'edit_users', 'delete_users',
                'manage_roles', 'assign_roles', 'view_permissions',
                'view_brokers', 'create_brokers', 'edit_brokers', 'delete_brokers',
                'view_settings', 'edit_settings',
                'view_renewals', 'process_renewals', 'send_renewal_reminders',
            ],

            'broker_admin' => [
                'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
                'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes',
                'view_policies', 'create_policies', 'edit_policies', 'renew_policies',
                'view_certificates', 'generate_certificates', 'download_certificates', 'manage_certificate_templates',
                'view_certificate_templates', 'create_certificate_templates', 'edit_certificate_templates', 'delete_certificate_templates', 'manage_certificate_settings',
                'view_financial_notes', 'create_financial_notes', 'edit_financial_notes', 'delete_financial_notes',
                'view_messages', 'create_messages', 'reply_to_messages', 'delete_messages', 'mark_messages_read',
                'view_reports', 'generate_reports', 'export_reports',
                'view_users', 'create_users', 'edit_users', 'delete_users',
                'manage_roles', 'assign_roles', 'view_permissions',
                'view_settings', 'edit_settings',
                'view_renewals', 'process_renewals', 'send_renewal_reminders',
            ],

            'underwriter_staff' => [
                'view_customers', 'create_customers', 'edit_customers',
                'view_quotes', 'create_quotes', 'edit_quotes', 'send_quotes',
                'view_policies', 'create_policies', 'edit_policies', 'renew_policies',
                'view_certificates', 'generate_certificates', 'download_certificates', 'verify_certificates',
                'view_certificate_templates', 'manage_certificate_settings',
                'view_financial_notes', 'create_financial_notes', 'create_debit_notes', 'create_credit_notes',
                'view_invoices', 'download_invoices', 'view_receipts', 'download_receipts',
                'view_messages', 'create_messages', 'reply_to_messages', 'mark_messages_read', 'send_messages',
                'view_reports', 'generate_reports', 'export_reports',
                'view_renewals', 'process_renewals', 'schedule_reminders',
                'view_claims', 'create_claims', 'edit_claims',
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets', 'assign_tickets', 'resolve_tickets', 'close_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles', 'publish_kb_articles', 'archive_kb_articles',
                'view_document_templates', 'create_document_templates', 'edit_document_templates', 'preview_document_template',
            ],

            'broker_staff' => [
                'view_customers', 'create_customers', 'edit_customers',
                'view_quotes', 'create_quotes', 'edit_quotes', 'send_quotes',
                'view_policies', 'edit_policies', 'renew_policies',
                'view_certificates', 'generate_certificates', 'download_certificates', 'verify_certificates',
                'view_certificate_templates', 'manage_certificate_settings',
                'view_financial_notes', 'create_debit_notes',
                'view_invoices', 'download_invoices', 'view_receipts', 'download_receipts',
                'view_messages', 'create_messages', 'reply_to_messages', 'mark_messages_read', 'send_messages',
                'view_reports', 'export_reports',
                'view_renewals', 'schedule_reminders',
                'view_claims', 'create_claims', 'edit_claims',
                'view_support_tickets', 'create_support_tickets', 'edit_support_tickets', 'assign_tickets', 'resolve_tickets', 'close_tickets',
                'view_kb_articles', 'create_kb_articles', 'edit_kb_articles', 'publish_kb_articles', 'archive_kb_articles',
                'view_document_templates', 'create_document_templates', 'edit_document_templates', 'preview_document_template',
            ],

            'customer' => [
                'view_policies', 'view_quotes', 'view_financial_notes',
                'view_certificates', 'download_certificates', 'verify_certificates',
                'view_invoices', 'download_invoices', 'view_receipts', 'download_receipts',
                'view_messages', 'create_messages', 'reply_to_messages',
                'view_renewals', 'view_claims', 'create_claims', 'edit_claims',
                'view_support_tickets', 'create_support_tickets',
                'view_kb_articles',
                'view_document_templates', 'preview_document_template',
            ],
        ];

        // Assign permissions to roles
        foreach ($rolePermissions as $roleName => $rolePerms) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $permissionsToSync = [];
                foreach ($rolePerms as $permissionName) {
                    $permission = Permission::where('name', $permissionName)->first();
                    if ($permission) {
                        $permissionsToSync[] = $permission;
                    }
                }

                // Sync permissions (this will add missing and keep existing)
                $role->syncPermissions($permissionsToSync);
                $this->command->info("Updated permissions for role: {$roleName} (".count($permissionsToSync).' permissions)');
            } else {
                $this->command->warn("Role not found: {$roleName}");
            }
        }

        $this->command->info('Comprehensive permission seeding completed successfully!');
    }
}
