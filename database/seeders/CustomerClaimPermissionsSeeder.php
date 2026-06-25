<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Grants claim permissions to the existing 'customer' role.
 * Run with: php artisan db:seed --class=CustomerClaimPermissionsSeeder
 */
class CustomerClaimPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $customerRole = Role::where('name', 'customer')->first();

        if (! $customerRole) {
            $this->command->error('Customer role not found.');

            return;
        }

        $claimPermissions = ['view_claims', 'create_claims', 'edit_claims'];

        foreach ($claimPermissions as $permissionName) {
            $permission = Permission::where('name', $permissionName)->first();

            if (! $permission) {
                $this->command->warn("Permission [{$permissionName}] not found, skipping.");

                continue;
            }

            if (! $customerRole->hasPermissionTo($permissionName)) {
                $customerRole->givePermissionTo($permission);
                $this->command->info("Granted [{$permissionName}] to customer role.");
            } else {
                $this->command->line("Customer role already has [{$permissionName}], skipping.");
            }
        }

        // Clear cache so changes take effect immediately
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('Customer claim permissions updated successfully.');
    }
}
