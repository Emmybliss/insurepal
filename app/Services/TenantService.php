<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TenantService
{
    /**
     * Create a new tenant with admin user.
     */
    public function createTenantWithAdmin(array $tenantData, array $adminData): Tenant
    {
        return DB::transaction(function () use ($tenantData, $adminData) {
            // Create tenant
            $tenant = Tenant::create([
                'name' => $tenantData['company_name'],
                'type' => $tenantData['type'],
                'email' => $tenantData['email'],
                'phone' => $tenantData['phone'] ?? null,
                'address' => $tenantData['address'] ?? null,
                'status' => 'active',
                'trial_ends_at' => now()->addDays(14),
            ]);

            // Create admin user
            $user = User::create([
                'name' => $adminData['name'],
                'email' => $adminData['email'],
                'password' => Hash::make($adminData['password']),
                'tenant_id' => $tenant->id,
                'phone' => $adminData['phone'] ?? null,
                // 'is_super_admin' => false,
            ]);

            // Assign role based on tenant type
            $role = $tenantData['type'] === 'underwriter' ? 'underwriter' : 'broker';
            $user->assignRole($role);

            return $tenant;
        });
    }

    /**
     * Check if a tenant can access a resource.
     */
    public function canAccess(Tenant $tenant, string $permission): bool
    {
        if (! $tenant->isActive()) {
            return false;
        }

        // Add permission logic here if needed
        return true;
    }

    /**
     * Get tenant usage statistics.
     */
    public function getTenantStats(Tenant $tenant): array
    {
        return [
            'users_count' => $tenant->users()->count(),
            'customers_count' => $tenant->customers()->count(),
            'policies_count' => $tenant->policies()->count(),
            'quotes_count' => $tenant->quotes()->count(),
        ];
    }

    /**
     * Suspend a tenant.
     */
    public function suspend(Tenant $tenant, ?string $reason = null): bool
    {
        return $tenant->update([
            'status' => 'suspended',
            'settings' => array_merge($tenant->settings ?? [], [
                'suspension_reason' => $reason,
                'suspended_at' => now(),
            ]),
        ]);
    }

    /**
     * Reactivate a suspended tenant.
     */
    public function reactivate(Tenant $tenant): bool
    {
        $settings = $tenant->settings ?? [];
        unset($settings['suspension_reason'], $settings['suspended_at']);

        return $tenant->update([
            'status' => 'active',
            'settings' => $settings,
        ]);
    }
}
