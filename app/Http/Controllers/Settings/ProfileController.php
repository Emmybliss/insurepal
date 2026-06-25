<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Get user roles and permissions
        $userRoles = $user->roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $role->label ?? ucwords(str_replace('_', ' ', $role->name)),
                'description' => $role->description,
                'permissions_count' => $role->permissions->count(),
                'created_at' => $role->created_at,
            ];
        });

        $userPermissions = $user->getAllPermissions()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'label' => $permission->label ?? ucwords(str_replace('_', ' ', $permission->name)),
                'description' => $permission->description,
                'module' => $permission->module ?? 'General',
                'via_role' => $permission->pivot->role_id ?? null,
            ];
        })->groupBy('module');

        // Get all available roles and permissions for super admins
        $availableRoles = collect();
        $availablePermissions = collect();

        if ($user->isSuperAdmin()) {
            $availableRoles = Role::with('permissions')->get()->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => $role->label ?? ucwords(str_replace('_', ' ', $role->name)),
                    'description' => $role->description,
                    'permissions_count' => $role->permissions->count(),
                    'users_count' => $role->users->count(),
                ];
            });

            $availablePermissions = Permission::all()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'label' => $permission->label ?? ucwords(str_replace('_', ' ', $permission->name)),
                    'description' => $permission->description,
                    'module' => $permission->module ?? 'General',
                ];
            })->groupBy('module');
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'userRoles' => $userRoles,
            'userPermissions' => $userPermissions,
            'availableRoles' => $availableRoles,
            'availablePermissions' => $availablePermissions,
            'canManageRoles' => $user->can('manage_roles') || $user->isSuperAdmin(),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->safe()->only(['name', 'email']));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Handle avatar upload — profile image belongs in users.avatar
        if ($request->hasFile('avatar')) {
            $user = $request->user();
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('users/avatars', 'public');
            $request->user()->avatar = $path;
        }

        // Handle signature upload
        if ($request->hasFile('signature')) {
            $user = $request->user();
            if ($user->signature && Storage::disk('public')->exists($user->signature)) {
                Storage::disk('public')->delete($user->signature);
            }
            $path = $request->file('signature')->store('users/signatures', 'public');
            $request->user()->signature = $path;
        }

        $request->user()->save();

        return to_route('settings.profile');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
