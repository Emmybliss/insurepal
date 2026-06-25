<?php

namespace App\Http\Controllers;

use App\Models\Customer;
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
                        ->orWhere('quote_number', 'like', "%{$search}%")
                        ->orWhere('claim_reference', 'like', "%{$search}%")
                        ->orWhere('note_number', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('file_name', 'like', "%{$search}%");
                });
            }

            $records = $query->get();

            foreach ($records as $record) {
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

    public function restore(string $type, int $id)
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
        if ($user->tenant_id && $record->tenant_id !== $user->tenant_id) {
            if (! $user->hasRole('super_admin')) {
                return back()->with('error', 'You can only restore records from your tenant.');
            }
        }

        $error = $this->checkRestoreDependencies($record, $type);

        if ($error) {
            return back()->with('error', $error);
        }

        $record->restore();

        return back()->with('success', 'Record restored successfully.');
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

        $record->forceDelete();

        return back()->with('success', 'Record permanently deleted.');
    }

    private function getModelClass(string $type): ?string
    {
        return $this->models[$type] ?? null;
    }

    private function checkRestoreDependencies(object $record, string $type): ?string
    {
        return match ($type) {
            'customers' => $this->checkCustomerDependencies($record),
            'policies' => $this->checkPolicyDependencies($record),
            'claims' => $this->checkClaimDependencies($record),
            'debit-notes' => $this->checkDebitNoteDependencies($record),
            'credit-notes' => $this->checkCreditNoteDependencies($record),
            default => null,
        };
    }

    private function checkCustomerDependencies(object $record): ?string
    {
        return null;
    }

    private function checkPolicyDependencies(object $record): ?string
    {
        $customerId = $record->customer_id ?? null;

        if ($customerId) {
            $customer = Customer::onlyTrashed()->find($customerId);

            if ($customer) {
                return 'Restore the linked customer before restoring this policy.';
            }
        }

        return null;
    }

    private function checkClaimDependencies(object $record): ?string
    {
        $policyId = $record->policy_id ?? null;
        $customerId = $record->customer_id ?? null;

        if ($policyId) {
            $policy = Policy::onlyTrashed()->find($policyId);

            if ($policy) {
                return 'Restore the linked policy before restoring this claim.';
            }
        }

        if ($customerId) {
            $customer = Customer::onlyTrashed()->find($customerId);

            if ($customer) {
                return 'Restore the linked customer before restoring this claim.';
            }
        }

        return null;
    }

    private function checkDebitNoteDependencies(object $record): ?string
    {
        $policyId = $record->policy_id ?? null;
        $customerId = $record->customer_id ?? null;

        if ($policyId) {
            $policy = Policy::onlyTrashed()->find($policyId);

            if ($policy) {
                return 'Restore the linked policy before restoring this debit note.';
            }
        }

        if ($customerId) {
            $customer = Customer::onlyTrashed()->find($customerId);

            if ($customer) {
                return 'Restore the linked customer before restoring this debit note.';
            }
        }

        return null;
    }

    private function checkCreditNoteDependencies(object $record): ?string
    {
        $policyId = $record->policy_id ?? null;
        $customerId = $record->customer_id ?? null;

        if ($policyId) {
            $policy = Policy::onlyTrashed()->find($policyId);

            if ($policy) {
                return 'Restore the linked policy before restoring this credit note.';
            }
        }

        if ($customerId) {
            $customer = Customer::onlyTrashed()->find($customerId);

            if ($customer) {
                return 'Restore the linked customer before restoring this credit note.';
            }
        }

        return null;
    }
}
