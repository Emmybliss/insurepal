<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePermissionManagementRequest;
use App\Http\Requests\UpdatePermissionManagementRequest;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PermissionManagementController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('tenant.access');
    }

    public function index(Request $request)
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        $query = Permission::forTenant($tenant->id)
            ->with(['roles'])
            ->withCount(['roles']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('display_name', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhere('category', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        if ($request->filled('system')) {
            if ($request->boolean('system')) {
                $query->system();
            } else {
                $query->nonSystem();
            }
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } else {
                $query->where('is_active', false);
            }
        }

        $permissions = $query->orderBy('category')->orderBy('name')->paginate(15);

        $categories = Permission::forTenant($tenant->id)
            ->select('category')
            ->distinct()
            ->whereNotNull('category')
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('PermissionManagement/Index', [
            'permissions' => $permissions,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'system', 'status']),
            'stats' => [
                'total' => Permission::forTenant($tenant->id)->count(),
                'active' => Permission::forTenant($tenant->id)->active()->count(),
                'system' => Permission::forTenant($tenant->id)->system()->count(),
                'custom' => Permission::forTenant($tenant->id)->nonSystem()->count(),
                'categories' => Permission::forTenant($tenant->id)->distinct('category')->count('category'),
            ],
        ]);
    }

    public function create()
    {
        abort(403, 'System permissions are managed platform-wide and cannot be created by tenant users');
    }

    public function store(StorePermissionManagementRequest $request)
    {
        abort(403, 'System permissions are managed platform-wide and cannot be created by tenant users');
    }

    public function show(Permission $permission)
    {
        $this->authorizePermissionAccess($permission);

        $user = Auth::user();

        if ($user->hasRole('super_admin')) {
            $permission->load(['roles']);
        } else {
            $tenant = $user->tenant;
            $tenantType = $tenant?->type;

            $allowedRoleNames = match ($tenantType) {
                'broker' => ['broker', 'broker_admin', 'broker_staff', 'staff'],
                'underwriter' => ['underwriter', 'underwriter_admin', 'underwriter_staff', 'staff'],
                default => ['staff'],
            };

            $permission->load(['roles' => function ($query) use ($tenant, $allowedRoleNames) {
                $query->where(function ($q) use ($tenant, $allowedRoleNames) {
                    $q->where('tenant_id', $tenant->id)
                        ->orWhere(function ($gq) use ($allowedRoleNames) {
                            $gq->whereNull('tenant_id')
                                ->whereIn('name', $allowedRoleNames);
                        });
                });
            }]);
        }

        return Inertia::render('PermissionManagement/Show', [
            'permission' => $permission,
        ]);
    }

    public function edit(Permission $permission)
    {
        abort(403, 'System permissions cannot be edited by tenant users');
    }

    public function update(UpdatePermissionManagementRequest $request, Permission $permission)
    {
        abort(403, 'System permissions cannot be updated by tenant users');
    }

    public function destroy(Permission $permission)
    {
        abort(403, 'System permissions cannot be deleted by tenant users');
    }

    public function toggleStatus(Permission $permission)
    {
        abort(403, 'System permissions status cannot be modified by tenant users');
    }

    private function authorizePermissionAccess(Permission $permission): void
    {
        $user = Auth::user();

        if (! $user) {
            abort(401, 'User not authenticated');
        }

        if ($user->hasRole('super_admin')) {
            return;
        }

        $tenant = $user->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        if ($permission->tenant_id !== null && $permission->tenant_id !== $tenant->id) {
            abort(403, 'Unauthorized access: Permission belongs to different tenant');
        }
    }
}
