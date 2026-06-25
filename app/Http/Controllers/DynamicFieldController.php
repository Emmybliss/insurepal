<?php

namespace App\Http\Controllers;

use App\Http\Requests\DynamicFieldRequest;
use App\Models\Customer;
use App\Models\DynamicField;
use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DynamicFieldController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('view_dynamic_fields');

        $query = DynamicField::query()->with(['tenant', 'policy', 'customer']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('field_name', 'like', "%{$search}%")
                    ->orWhere('field_label', 'like', "%{$search}%");
            });
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('field_type')) {
            $query->where('field_type', $request->field_type);
        }

        if ($request->filled('policy_id')) {
            $query->forPolicy($request->policy_id);
        }

        if ($request->filled('customer_id')) {
            $query->forCustomer($request->customer_id);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $fields = $query->ordered()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('DynamicFields/Index', [
            'fields' => $fields,
            'filters' => $request->only(['search', 'entity_type', 'field_type', 'policy_id', 'customer_id', 'status']),
            'fieldTypes' => DynamicField::getAvailableFieldTypes(),
            'entityTypes' => DynamicField::getAvailableEntityTypes(),
        ]);
    }

    public function create(Request $request)
    {
        Gate::authorize('create_dynamic_fields');

        $policies = [];
        $customers = [];

        if ($request->filled('policy_id')) {
            $policies = Policy::where('tenant_id', Auth::user()->tenant_id)
                ->where('id', $request->policy_id)
                ->get(['id', 'policy_number']);
        }

        if ($request->filled('customer_id')) {
            $customers = Customer::where('tenant_id', Auth::user()->tenant_id)
                ->where('id', $request->customer_id)
                ->get(['id', 'first_name', 'last_name', 'company_name', 'type']);
        }

        return Inertia::render('DynamicFields/Create', [
            'fieldTypes' => DynamicField::getAvailableFieldTypes(),
            'entityTypes' => DynamicField::getAvailableEntityTypes(),
            'policies' => $policies,
            'customers' => $customers,
            'preselected' => $request->only(['policy_id', 'customer_id', 'entity_type']),
        ]);
    }

    public function store(DynamicFieldRequest $request)
    {
        Gate::authorize('create_dynamic_fields');

        $validatedData = $request->validated();
        $validatedData['tenant_id'] = Auth::user()->tenant_id;

        $field = DynamicField::create($validatedData);

        return redirect()
            ->route('dynamic-fields.index')
            ->with('success', 'Dynamic field created successfully.');
    }

    public function show(DynamicField $dynamicField)
    {
        Gate::authorize('view_dynamic_fields');

        return Inertia::render('DynamicFields/Show', [
            'field' => $dynamicField->load(['tenant', 'policy', 'customer']),
        ]);
    }

    public function edit(DynamicField $dynamicField)
    {
        Gate::authorize('edit_dynamic_fields');

        $policies = Policy::where('tenant_id', Auth::user()->tenant_id)
            ->get(['id', 'policy_number']);

        $customers = Customer::where('tenant_id', Auth::user()->tenant_id)
            ->get(['id', 'first_name', 'last_name', 'company_name', 'type']);

        return Inertia::render('DynamicFields/Edit', [
            'field' => $dynamicField,
            'fieldTypes' => DynamicField::getAvailableFieldTypes(),
            'entityTypes' => DynamicField::getAvailableEntityTypes(),
            'policies' => $policies,
            'customers' => $customers,
        ]);
    }

    public function update(DynamicFieldRequest $request, DynamicField $dynamicField)
    {
        Gate::authorize('edit_dynamic_fields');

        $validatedData = $request->validated();
        $dynamicField->update($validatedData);

        return redirect()
            ->route('dynamic-fields.index')
            ->with('success', 'Dynamic field updated successfully.');
    }

    public function destroy(DynamicField $dynamicField)
    {
        Gate::authorize('delete_dynamic_fields');

        $dynamicField->delete();

        return redirect()
            ->route('dynamic-fields.index')
            ->with('success', 'Dynamic field deleted successfully.');
    }

    public function forEntity(Request $request, string $entityType, int $entityId)
    {
        Gate::authorize('view_dynamic_fields');

        $fields = DynamicField::query()
            ->where('tenant_id', Auth::user()->tenant_id)
            ->forEntity($entityType, $entityId)
            ->active()
            ->ordered()
            ->get();

        return response()->json([
            'fields' => $fields,
        ]);
    }

    public function forPolicy(Request $request, Policy $policy)
    {
        Gate::authorize('view_dynamic_fields');

        $fields = $policy->dynamicFields()
            ->active()
            ->ordered()
            ->get();

        return response()->json([
            'fields' => $fields,
        ]);
    }

    public function forCustomer(Request $request, Customer $customer)
    {
        Gate::authorize('view_dynamic_fields');

        $fields = $customer->dynamicFields()
            ->active()
            ->ordered()
            ->get();

        return response()->json([
            'fields' => $fields,
        ]);
    }

    public function bulkUpdate(Request $request)
    {
        Gate::authorize('edit_dynamic_fields');

        $request->validate([
            'fields' => 'required|array',
            'fields.*.id' => 'required|exists:dynamic_fields,id',
            'fields.*.field_value' => 'nullable',
        ]);

        foreach ($request->fields as $fieldData) {
            $field = DynamicField::find($fieldData['id']);

            if ($field && $field->tenant_id === Auth::user()->tenant_id) {
                $field->update([
                    'field_value' => $fieldData['field_value'] ?? null,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Fields updated successfully.',
        ]);
    }
}
