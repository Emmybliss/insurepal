<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class AssignUserRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:assign-user-roles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign roles to users for development/testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::all();

        if ($users->isEmpty()) {
            $this->error('No users found.');

            return;
        }

        $this->info('Found '.$users->count().' users.');

        $roles = Role::all();
        $this->info('Available roles: '.$roles->pluck('name')->join(', '));

        foreach ($users as $user) {
            $this->info("User: {$user->name} (ID: {$user->id})");
            $this->info('Current roles: '.$user->roles->pluck('name')->join(', '));

            if ($user->roles->isEmpty()) {
                // Assign underwriter role to first user, broker to others
                $roleName = $user->id === 1 ? 'underwriter' : 'broker';
                $user->assignRole($roleName);
                $this->info("Assigned '{$roleName}' role to {$user->name}");
            } else {
                $this->info('User already has roles assigned.');
            }

            $this->info('Final roles: '.$user->fresh()->roles->pluck('name')->join(', '));
            $this->info('Can view quotes: '.($user->can('view quotes') ? 'Yes' : 'No'));
            $this->info('---');
        }

        $this->info('Role assignment completed!');
    }
}
