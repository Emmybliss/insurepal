<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing users from simple role column to Spatie roles
        $users = User::all();

        foreach ($users as $user) {
            // Map old role values to new Spatie role names
            $roleName = match ($user->role ?? 'staff') {
                'super_admin' => 'super_admin',
                'underwriter' => 'underwriter',
                'broker' => 'broker',
                'staff' => $this->determineStaffRole($user),
                'customer' => 'customer',
                'admin' => 'super_admin', // Legacy admin -> super_admin
                default => 'customer',
            };

            // Ensure the role exists
            $role = Role::where('name', $roleName)->first();
            if (! $role) {
                // Create role if it doesn't exist
                $role = Role::create([
                    'name' => $roleName,
                    'label' => ucwords(str_replace('_', ' ', $roleName)),
                    'description' => 'Migrated role',
                    'guard_name' => 'web',
                    'is_active' => true,
                ]);
            }

            // Assign role to user if they don't already have it
            if (! $user->hasRole($roleName)) {
                $user->assignRole($roleName);
            }
        }
    }

    /**
     * Determine staff role based on tenant type
     */
    private function determineStaffRole(User $user): string
    {
        if (! $user->tenant) {
            return 'customer';
        }

        return match ($user->tenant->type) {
            'underwriter' => 'underwriter_staff',
            'broker' => 'broker_staff',
            default => 'customer',
        };
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove all role assignments for users
        User::with('roles')->get()->each(function ($user) {
            $user->roles()->detach();
        });
    }
};
