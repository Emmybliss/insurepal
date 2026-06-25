<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DebitNoteSeeder extends Seeder
{
    public function run(): void
    {
        $debitNotePermissions = [
            'view_debit_notes' => 'View debit notes list and details',
            'create_debit_notes' => 'Create new debit notes',
            'edit_debit_notes' => 'Edit draft debit notes',
            'delete_debit_notes' => 'Delete draft debit notes',
            'generate_debit_notes' => 'Generate debit note documents',
            'regenerate_debit_notes' => 'Regenerate debit note documents',
            'issue_debit_notes' => 'Issue debit notes to customers',
            'mark_debit_notes_paid' => 'Mark debit notes as paid',
            'cancel_debit_notes' => 'Cancel issued debit notes',
            'download_debit_notes' => 'Download debit note PDFs',
        ];

        // Create permissions
        $createdCount = 0;
        foreach ($debitNotePermissions as $permission => $description) {
            $created = Permission::firstOrCreate(
                ['name' => $permission],
                ['guard_name' => 'web']
            );
            if ($created->wasRecentlyCreated) {
                $createdCount++;
            }
        }

        $this->command->info("Created {$createdCount} new debit note permissions.");

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
                foreach (array_keys($debitNotePermissions) as $permission) {
                    if (! $role->hasPermissionTo($permission)) {
                        $role->givePermissionTo($permission);
                    }
                }
                $this->command->info("Updated debit note permissions for role: {$roleName}");
            } else {
                $this->command->warn("Role not found: {$roleName}");
            }
        }

        // Customer permissions (read-only mostly)
        $customerRole = Role::where('name', 'customer')->first();
        if ($customerRole) {
            $customerPermissions = [
                'view_debit_notes',
                'download_debit_notes',
            ];

            foreach ($customerPermissions as $permission) {
                if (! $customerRole->hasPermissionTo($permission)) {
                    $customerRole->givePermissionTo($permission);
                }
            }
            $this->command->info('Updated debit note permissions for role: customer');
        }
        $this->command->info('Debit note permissions seeded successfully.');
    }
}
