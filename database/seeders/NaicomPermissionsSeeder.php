<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class NaicomPermissionsSeeder extends Seeder
{
    private const NAICOM_PERMISSIONS = [
        'naicom-reports.view',
        'naicom-reports.generate',
        'naicom-reports.review',
        'naicom-reports.adjust',
        'naicom-reports.approve',
        'naicom-reports.lock',
        'naicom-reports.export',
        'naicom-reports.submit',
        'naicom-reports.restate',
    ];

    private const STAFF_NAICOM_PERMISSIONS = [
        'naicom-reports.view',
        'naicom-reports.generate',
    ];

    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->ensurePermissionsExist();
        $this->assignToGlobalRoles();
        $this->assignToTenantRoles();

        $this->command->info('NAICOM permissions seeded successfully for all tenants.');
    }

    private function ensurePermissionsExist(): void
    {
        $existing = Permission::whereIn('name', self::NAICOM_PERMISSIONS)->pluck('name')->toArray();
        $missing = array_diff(self::NAICOM_PERMISSIONS, $existing);

        foreach ($missing as $name) {
            $action = str_replace('naicom-reports.', '', $name);
            Permission::create([
                'name' => $name,
                'tenant_id' => null,
                'guard_name' => 'web',
                'display_name' => ucfirst($action) . ' NAICOM Reports',
                'category' => 'Reports & Analytics',
                'description' => "Allows user to {$action} NAICOM compliance reports",
                'is_system_permission' => true,
                'is_active' => true,
            ]);
        }
    }

    private function assignToGlobalRoles(): void
    {
        $this->givePermissionsToRole('super_admin', self::NAICOM_PERMISSIONS);
        $this->givePermissionsToRole('underwriter', self::NAICOM_PERMISSIONS);
        $this->givePermissionsToRole('broker', self::NAICOM_PERMISSIONS);
        $this->givePermissionsToRole('underwriter_staff', self::STAFF_NAICOM_PERMISSIONS);
        $this->givePermissionsToRole('broker_staff', self::STAFF_NAICOM_PERMISSIONS);
    }

    private function assignToTenantRoles(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            if ($tenant->type === 'underwriter') {
                $this->ensureTenantRole($tenant, 'underwriter_admin', self::NAICOM_PERMISSIONS);
                $this->ensureTenantRole($tenant, 'underwriter_staff', self::STAFF_NAICOM_PERMISSIONS);
            } elseif ($tenant->type === 'broker') {
                $this->ensureTenantRole($tenant, 'broker_admin', self::NAICOM_PERMISSIONS);
                $this->ensureTenantRole($tenant, 'broker_staff', self::STAFF_NAICOM_PERMISSIONS);
            }
        }
    }

    private function givePermissionsToRole(string $roleName, array $permissions): void
    {
        $role = Role::where('name', $roleName)->first();

        if ($role) {
            $role->givePermissionTo($permissions);
        }
    }

    private function ensureTenantRole(Tenant $tenant, string $roleName, array $permissionNames): void
    {
        $role = Role::firstOrCreate(
            ['name' => $roleName, 'tenant_id' => $tenant->id],
            [
                'guard_name' => 'web',
                'display_name' => ucwords(str_replace('_', ' ', $roleName)),
                'is_active' => true,
                'is_system_role' => false,
            ]
        );

        $permissions = Permission::whereIn('name', $permissionNames)->get();
        $role->givePermissionTo($permissions);
    }
}
