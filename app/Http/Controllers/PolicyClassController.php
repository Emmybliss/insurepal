<?php

namespace App\Http\Controllers;

use App\Http\Requests\PolicyClassRequest;
use App\Models\PolicyClass;
use App\Models\PolicyType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PolicyClassController extends Controller
{
    public function index(Request $request): Response
    {
        $policyClasses = PolicyClass::query()
            ->with('policyType')
            ->when($request->search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhereHas('policyType', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            )
            ->when($request->status !== null, fn ($query) => $query->where('is_active', $request->status)
            )
            ->when($request->policy_type_id, fn ($query, $typeId) => $query->where('policy_type_id', $typeId)
            )
            ->ordered()
            ->paginate(15)
            ->withQueryString();

        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name']);

        return Inertia::render('Admin/PolicyClasses/Index', [
            'policyClasses' => $policyClasses,
            'policyTypes' => $policyTypes,
            'filters' => $request->only(['search', 'status', 'policy_type_id']),
        ]);
    }

    public function create(): Response
    {
        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name']);

        return Inertia::render('Admin/PolicyClasses/Create', [
            'policyTypes' => $policyTypes,
        ]);
    }

    public function store(PolicyClassRequest $request): RedirectResponse
    {
        PolicyClass::create($request->validated());

        return redirect()->route('admin.policy-classes.index')
            ->with('success', 'Policy class created successfully.');
    }

    public function show(PolicyClass $policyClass): Response
    {
        $policyClass->load(['policyType', 'policies']);

        return Inertia::render('Admin/PolicyClasses/Show', [
            'policyClass' => $policyClass,
        ]);
    }

    public function edit(PolicyClass $policyClass): Response
    {
        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name']);
        $policyClass->load('policyType');

        return Inertia::render('Admin/PolicyClasses/Edit', [
            'policyClass' => $policyClass,
            'policyTypes' => $policyTypes,
        ]);
    }

    public function update(PolicyClassRequest $request, PolicyClass $policyClass): RedirectResponse
    {
        $policyClass->update($request->validated());

        return redirect()->route('admin.policy-classes.index')
            ->with('success', 'Policy class updated successfully.');
    }

    public function destroy(PolicyClass $policyClass): RedirectResponse
    {
        if ($policyClass->policies()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete policy class that has associated policies.');
        }

        $policyClass->delete();

        return redirect()->route('admin.policy-classes.index')
            ->with('success', 'Policy class deleted successfully.');
    }

    public function toggleStatus(PolicyClass $policyClass): RedirectResponse
    {
        $policyClass->update(['is_active' => ! $policyClass->is_active]);

        $status = $policyClass->is_active ? 'activated' : 'deactivated';

        return redirect()->back()
            ->with('success', "Policy class {$status} successfully.");
    }

    public function getByType(PolicyType $policyType): Response
    {
        $classes = $policyType->policyClasses()
            ->active()
            ->ordered()
            ->get(['id', 'name', 'code', 'calculated_premium', 'min_sum_assured', 'max_sum_assured']);

        return response()->json($classes);
    }
}
