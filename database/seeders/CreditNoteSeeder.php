<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CreditNoteSeeder extends Seeder
{
    public function run(): void
    {
        $creditNotePermissions = [
            'view_credit_notes' => 'View credit notes list and details',
            'create_credit_notes' => 'Create new credit notes',
            'edit_credit_notes' => 'Edit draft credit notes',
            'delete_credit_notes' => 'Delete draft credit notes',
            'generate_credit_notes' => 'Generate credit note documents',
            'regenerate_credit_notes' => 'Regenerate credit note documents',
            'issue_credit_notes' => 'Issue credit notes to customers',
            'mark_credit_notes_paid' => 'Mark credit notes as paid',
            'cancel_credit_notes' => 'Cancel issued credit notes',
            'download_credit_notes' => 'Download credit note PDFs',
        ];

        // Create permissions
        $createdCount = 0;
        foreach ($creditNotePermissions as $permission => $description) {
            $created = Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
            if ($created->wasRecentlyCreated) {
                $createdCount++;
            }
        }

        $this->command->info("Created {$createdCount} new credit note permissions.");

        // Assign to Roles
        $rolesToAssign = [
            'underwriter',
            'broker',
            'underwriter_staff',
            'broker_staff',
        ];

        foreach ($rolesToAssign as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                foreach (array_keys($creditNotePermissions) as $permission) {
                    if (! $role->hasPermissionTo($permission)) {
                        $role->givePermissionTo($permission);
                    }
                }
                $this->command->info("Updated credit note permissions for role: {$roleName}");
            } else {
                $this->command->warn("Role not found: {$roleName}");
            }
        }

        // Customer permissions (read-only mostly)
        $customerRole = Role::where('name', 'customer')->first();
        if ($customerRole) {
            $customerPermissions = [
                'view_credit_notes',
                'download_credit_notes',
            ];

            foreach ($customerPermissions as $permission) {
                if (! $customerRole->hasPermissionTo($permission)) {
                    $customerRole->givePermissionTo($permission);
                }
            }
            $this->command->info('Updated credit note permissions for role: customer');
        }
        $this->command->info('Credit note permissions seeded successfully.');
    }
}
