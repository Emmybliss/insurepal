<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PolicyProductRequest;
use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PolicyProductController extends Controller
{
    public function index(Request $request): Response
    {
        $policyProducts = PolicyProduct::query()
            ->with(['policyType', 'policyClass', 'tenant'])
            ->when($request->search, fn ($query, $search) => $query->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhereHas('policyType', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                ->orWhereHas('policyClass', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            )
            ->when($request->status !== null, fn ($query) => $query->where('is_active', $request->status)
            )
            ->when($request->policy_type_id, fn ($query, $typeId) => $query->where('policy_type_id', $typeId)
            )
            ->when($request->policy_class_id, fn ($query, $classId) => $query->where('policy_class_id', $classId)
            )
            ->when($request->tenant_id, fn ($query, $tenantId) => $query->where('tenant_id', $tenantId)
            )
            ->ordered()
            ->paginate(15)
            ->withQueryString();

        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'policy_type_id']);

        return Inertia::render('Admin/PolicyProducts/Index', [
            'policyProducts' => $policyProducts,
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
            'filters' => $request->only(['search', 'status', 'policy_type_id', 'policy_class_id', 'tenant_id']),
        ]);
    }

    public function create(): Response
    {
        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name', 'code']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'code', 'policy_type_id']);

        return Inertia::render('Admin/PolicyProducts/Create', [
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
        ]);
    }

    public function store(PolicyProductRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Auto-calculate premium from hierarchy if not provided
        if (! isset($data['base_premium'])) {
            $policyClass = PolicyClass::with('policyType')->find($data['policy_class_id']);
            $data['base_premium'] = $policyClass->calculated_premium;
            $data['commission_rate'] = $policyClass->calculated_commission_rate;
        }

        PolicyProduct::create($data);

        return redirect()->route('admin.policy-products.index')
            ->with('success', 'Policy product created successfully.');
    }

    public function show(PolicyProduct $policyProduct): Response
    {
        $policyProduct->load([
            'policyType',
            'policyClass',
            'tenant',
            'policies.customer',
        ]);

        return Inertia::render('Admin/PolicyProducts/Show', [
            'policyProduct' => $policyProduct,
        ]);
    }

    public function edit(PolicyProduct $policyProduct): Response
    {
        $policyTypes = PolicyType::active()->ordered()->get(['id', 'name', 'code']);
        $policyClasses = PolicyClass::active()->with('policyType')->ordered()->get(['id', 'name', 'code', 'policy_type_id']);
        $policyProduct->load(['policyType', 'policyClass', 'tenant']);

        return Inertia::render('Admin/PolicyProducts/Edit', [
            'policyProduct' => $policyProduct,
            'policyTypes' => $policyTypes,
            'policyClasses' => $policyClasses,
        ]);
    }

    public function update(PolicyProductRequest $request, PolicyProduct $policyProduct): RedirectResponse
    {
        $policyProduct->update($request->validated());

        return redirect()->route('admin.policy-products.index')
            ->with('success', 'Policy product updated successfully.');
    }

    public function destroy(PolicyProduct $policyProduct): RedirectResponse
    {
        if ($policyProduct->policies()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete policy product that has associated policies.');
        }

        $policyProduct->delete();

        return redirect()->route('admin.policy-products.index')
            ->with('success', 'Policy product deleted successfully.');
    }

    public function toggleStatus(PolicyProduct $policyProduct): RedirectResponse
    {
        $policyProduct->update(['is_active' => ! $policyProduct->is_active]);

        $status = $policyProduct->is_active ? 'activated' : 'deactivated';

        return redirect()->back()
            ->with('success', "Policy product {$status} successfully.");
    }

    public function calculatePremium(Request $request)
    {
        $request->validate([
            'policy_product_id' => 'required|exists:policy_products,id',
            'sum_assured' => 'required|numeric|min:0',
            'factors' => 'nullable|array',
        ]);

        $policyProduct = PolicyProduct::findOrFail($request->policy_product_id);
        $premium = $policyProduct->calculatePremium($request->sum_assured, $request->factors ?? []);

        return response()->json([
            'premium' => $premium,
            'commission' => $premium * ($policyProduct->commission_rate / 100),
        ]);
    }

    public function getByClass(PolicyClass $policyClass)
    {
        $policyProducts = $policyClass->policyProducts()
            ->active()
            ->ordered()
            ->get(['id', 'name', 'code', 'base_premium', 'min_sum_assured', 'max_sum_assured']);

        return response()->json($policyProducts);
    }
}
