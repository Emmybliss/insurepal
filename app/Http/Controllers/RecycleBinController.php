<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RecycleBinController extends Controller
{
    private array $models;

    public function __construct()
    {
        $this->models = config('recycle-bin.models', []);
    }

    public function index(Request $request)
    {
        $this->authorize('recycle_bin_view');

        $user = Auth::user();
        $tenantId = $user->hasRole('super_admin') ? null : $user->tenant_id;

        $type = $request->input('type');
        $search = $request->input('search');

        $items = [];

        foreach ($this->models as $typeKey => $modelClass) {
            if ($type && $typeKey !== $type) {
                continue;
            }

            $query = $modelClass::onlyTrashed();

            if ($tenantId && in_array(\Illuminate\Database\Eloquent\Concerns\HasAttributes::class, class_uses_recursive($modelClass))) {
                $query->where('tenant_id', $tenantId);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('policy_number', 'like', "%{$search}%")
                        ->orWhere('internal_reference', 'like', "%{$search}%")
                        ->orWhere('quote_number', 'like', "%{$search}%")
                        ->orWhere('claim_reference', 'like', "%{$search}%")
                        ->orWhere('note_number', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('file_name', 'like', "%{$search}%");
                });
            }

            if ($typeKey === 'policies') {
                $query->with(['customer']);
            }

            $records = $query->get();

            foreach ($records as $record) {
                $metadata = [];
                if ($typeKey === 'policies') {
                    $metadata = [
                        'policy_number' => $record->policy_number_display ?: $record->policy_number,
                        'internal_reference' => $record->internal_reference,
                        'customer_name' => $record->customer?->display_name ?: 'N/A',
                    ];
                }

                $items[] = [
                    'type' => $typeKey,
                    'id' => $record->id,
                    'display_name' => method_exists($record, 'getRecycleBinDisplayName')
                        ? $record->getRecycleBinDisplayName()
                        : ($record->name ?? $record->id),
                    'deleted_at' => $record->deleted_at?->toIsoString(),
                    'auto_delete_at' => $record->deleted_at?->addDays(config('recycle-bin.retention_days', 30))->toIsoString(),
                    'days_remaining' => $record->deleted_at
                        ? now()->diffInDays($record->deleted_at->addDays(config('recycle-bin.retention_days', 30)), false)
                        : null,
                    'metadata' => $metadata,
                ];
            }
        }

        usort($items, function ($a, $b) {
            return $b['deleted_at'] <=> $a['deleted_at'];
        });

        $perPage = 20;
        $page = (int) $request->input('page', 1);
        $totalItems = count($items);
        $paginatedItems = array_slice($items, ($page - 1) * $perPage, $perPage);
        $totalPages = (int) ceil($totalItems / $perPage);

        return Inertia::render('recycle-bin/index', [
            'items' => $paginatedItems,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $totalItems,
                'total_pages' => $totalPages,
            ],
            'filters' => [
                'type' => $type,
                'search' => $search,
            ],
            'available_types' => array_keys($this->models),
        ]);
    }

    public function restore(Request $request, string $type, int $id)
    {
        $this->authorize('recycle_bin_restore');

        $modelClass = $this->getModelClass($type);

        if (! $modelClass) {
            return back()->with('error', 'Invalid record type.');
        }

        $record = $modelClass::onlyTrashed()->find($id);

        if (! $record) {
            return back()->with('error', 'Record not found in recycle bin.');
        }

        $user = Auth::user();
        if ($user->tenant_id && (int) $record->tenant_id !== (int) $user->tenant_id) {
            if (! $user->hasRole('super_admin')) {
                return back()->with('error', 'You can only restore records from your tenant.');
            }
        }

        $restorePolicy = $request->boolean('restore_policy');

        try {
            $message = app(\App\Services\Policies\PolicyDependencyService::class)
                ->restoreRecord($record, $type, $restorePolicy);

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function forceDelete(string $type, int $id)
    {
        $user = Auth::user();

        if (! $user->hasRole('super_admin')) {
            return back()->with('error', 'Only Super Admin can permanently delete records.');
        }

        $this->authorize('recycle_bin_force_delete');

        $modelClass = $this->getModelClass($type);

        if (! $modelClass) {
            return back()->with('error', 'Invalid record type.');
        }

        $record = $modelClass::onlyTrashed()->find($id);

        if (! $record) {
            return back()->with('error', 'Record not found in recycle bin.');
        }

        if ($type === 'policies' && $record instanceof Policy) {
            $dependencyError = app(\App\Services\Policies\PolicyDependencyService::class)->getDependencyError($record);
            if ($dependencyError) {
                return back()->with('error', $dependencyError);
            }
        }

        $record->forceDelete();

        return back()->with('success', 'Record permanently deleted.');
    }

    private function getModelClass(string $type): ?string
    {
        return $this->models[$type] ?? null;
    }
}
