<?php

namespace App\Http\Controllers;

use App\Http\Requests\PolicyTypeRequest;
use App\Models\PolicyType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PolicyTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $policyTypes = PolicyType::query()
            ->when($request->search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
            )
            ->when($request->status !== null, fn ($query) => $query->where('is_active', $request->status)
            )
            ->ordered()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/PolicyTypes/Index', [
            'policyTypes' => $policyTypes,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/PolicyTypes/Create');
    }

    public function store(PolicyTypeRequest $request): RedirectResponse
    {
        PolicyType::create($request->validated());

        return redirect()->route('policy-types.index')
            ->with('success', 'Policy type created successfully.');
    }

    public function show(PolicyType $policyType): Response
    {
        $policyType->load(['policyClasses.policyProducts', 'policies']);

        return Inertia::render('Admin/PolicyTypes/Show', [
            'policyType' => $policyType,
        ]);
    }

    public function edit(PolicyType $policyType): Response
    {
        return Inertia::render('Admin/PolicyTypes/Edit', [
            'policyType' => $policyType,
        ]);
    }

    public function update(PolicyTypeRequest $request, PolicyType $policyType): RedirectResponse
    {
        $policyType->update($request->validated());

        return redirect()->route('admin.policy-types.index')
            ->with('success', 'Policy type updated successfully.');
    }

    public function destroy(PolicyType $policyType): RedirectResponse
    {
        if ($policyType->policyClasses()->exists() || $policyType->policies()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete policy type that has associated classes or policies.');
        }

        $policyType->delete();

        return redirect()->route('admin.policy-types.index')
            ->with('success', 'Policy type deleted successfully.');
    }

    public function toggleStatus(PolicyType $policyType): RedirectResponse
    {
        $policyType->update(['is_active' => ! $policyType->is_active]);

        $status = $policyType->is_active ? 'activated' : 'deactivated';

        return redirect()->back()
            ->with('success', "Policy type {$status} successfully.");
    }
}
