<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DocumentTemplatePermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Define document template permissions
        $documentTemplatePermissions = [
            // Document Template Module Permissions (underscore format for sidebar)
            'view_document_templates' => 'View document templates',
            'create_document_templates' => 'Create new document templates',
            'edit_document_templates' => 'Edit existing document templates',
            'delete_document_templates' => 'Delete document templates',
            'duplicate_document_templates' => 'Duplicate document templates',
            'export_document_templates' => 'Export document templates as JSON',
            'import_document_templates' => 'Import document templates from JSON',
            'manage_document_templates' => 'Full access to document template management',

            // Document Template Module Permissions (hyphen format for gates)
            'view-document-templates' => 'View document templates list',
            'create-document-templates' => 'Create new document templates',
            'edit-document-templates' => 'Edit existing document templates',
            'delete-document-templates' => 'Delete document templates',
            'duplicate-document-templates' => 'Duplicate document templates',

            // Individual template permissions
            'view_document_template' => 'View individual document template',
            'edit_document_template' => 'Edit individual document template',
            'delete_document_template' => 'Delete individual document template',
            'preview_document_template' => 'Preview document template with sample data',

            // Document Generation from Templates
            'generate_documents_from_templates' => 'Generate documents from templates',
            'customize_document_templates' => 'Customize document template designs',
            'manage_template_placeholders' => 'Manage template placeholder fields',
            'set_default_templates' => 'Set default templates for document types',
        ];

        // Create permissions that don't exist
        $createdCount = 0;
        foreach ($documentTemplatePermissions as $permission => $description) {
            $created = Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
            if ($created->wasRecentlyCreated) {
                $createdCount++;
            }
        }

        $this->command->info("Created {$createdCount} new document template permissions.");

        // Get all tenant roles that should have access to document templates
        $tenantRoles = [
            'underwriter',
            'broker',
            'underwriter_staff',
            'broker_staff',
        ];

        // Give tenant roles full access to document template permissions
        foreach ($tenantRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                // Add all document template permissions to the role
                foreach (array_keys($documentTemplatePermissions) as $permission) {
                    $permissionModel = Permission::where('name', $permission)->first();
                    if ($permissionModel && ! $role->hasPermissionTo($permission)) {
                        $role->givePermissionTo($permission);
                    }
                }
                $this->command->info("Updated document template permissions for role: {$roleName}");
            } else {
                $this->command->warn("Role not found: {$roleName}");
            }
        }

        // Customer role gets read-only access to view generated documents
        $customerRole = Role::where('name', 'customer')->first();
        if ($customerRole) {
            $customerPermissions = [
                'view_document_templates',
                'preview_document_template',
            ];

            foreach ($customerPermissions as $permission) {
                $permissionModel = Permission::where('name', $permission)->first();
                if ($permissionModel && ! $customerRole->hasPermissionTo($permission)) {
                    $customerRole->givePermissionTo($permission);
                }
            }
            $this->command->info('Updated customer document template permissions (read-only)');
        }

        $this->command->info('Document template permission seeding completed successfully!');
    }
}
