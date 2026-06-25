<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Placement;
use App\Models\PolicyProduct;
use App\Models\Quote;
use App\Services\PlacementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlacementController extends Controller
{
    public function __construct(
        protected PlacementService $placementService,
    ) {
        $this->middleware('tenant.type:broker');
    }

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'customer_id', 'date_from', 'date_to']);

        return Inertia::render('placements/Index', [
            'placements' => $this->placementService->getPlacementsForTenant($filters, $request->integer('per_page', 15)),
            'filters' => $filters,
            'customers' => Customer::forTenant($request->user()->tenant_id)
                ->select('id', 'type', 'first_name', 'last_name', 'company_name')
                ->get(),
        ]);
    }

    public function create(Request $request): Response
    {
        $quote = null;
        if ($request->filled('quote_id')) {
            $quote = Quote::forTenant($request->user()->tenant_id)
                ->with('customer', 'insuranceProduct')
                ->findOrFail($request->quote_id);
        }

        return Inertia::render('placements/Create', [
            'quote' => $quote,
            'customers' => Customer::forTenant($request->user()->tenant_id)
                ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email')
                ->get(),
            'policyProducts' => PolicyProduct::forTenant($request->user()->tenant_id)
                ->where('is_active', true)
                ->with('policyClass:id,name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'quote_id' => ['nullable', 'exists:quotes,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'insured_id' => ['nullable', 'exists:customers,id'],
            'policy_product_id' => ['required', 'exists:policy_products,id'],
            'currency' => ['nullable', 'string', 'size:3'],
            'proposed_start_date' => ['required', 'date'],
            'proposed_end_date' => ['required', 'date', 'after:proposed_start_date'],
            'total_sum_insured' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'risk_details' => ['nullable', 'array'],
            'markets' => ['nullable', 'array'],
            'markets.*.insurance_company_id' => ['required', 'string'],
            'markets.*.participation_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'markets.*.status' => ['nullable', 'string'],
            'markets.*.response_notes' => ['nullable', 'string'],
        ]);

        $placement = $this->placementService->createPlacement($validated);

        return to_route('placements.show', $placement);
    }

    public function show(Placement $placement): Response
    {
        $placement->load([
            'customer',
            'insured',
            'policyProduct.policyClass',
            'policyProduct.policyType',
            'markets.insuranceCompany',
            'markets.brokerSlips',
            'brokerSlips' => fn ($q) => $q->latest(),
            'createdBy',
            'policy',
        ]);

        return Inertia::render('placements/Show', [
            'placement' => $placement,
        ]);
    }

    public function edit(Placement $placement): Response
    {
        $placement->load(['customer', 'insured', 'policyProduct', 'markets.insuranceCompany']);

        return Inertia::render('placements/Edit', [
            'placement' => $placement,
            'customers' => Customer::forTenant(request()->user()->tenant_id)
                ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email')
                ->get(),
            'policyProducts' => PolicyProduct::forTenant(request()->user()->tenant_id)
                ->where('is_active', true)
                ->with('policyClass:id,name')
                ->get(),
        ]);
    }

    public function update(Request $request, Placement $placement): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => ['sometimes', 'exists:customers,id'],
            'insured_id' => ['nullable', 'exists:customers,id'],
            'policy_product_id' => ['sometimes', 'exists:policy_products,id'],
            'currency' => ['nullable', 'string', 'size:3'],
            'proposed_start_date' => ['sometimes', 'date'],
            'proposed_end_date' => ['sometimes', 'date', 'after:proposed_start_date'],
            'total_sum_insured' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'risk_details' => ['nullable', 'array'],
            'markets' => ['nullable', 'array'],
            'markets.*.insurance_company_id' => ['required', 'string'],
            'markets.*.participation_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'markets.*.status' => ['nullable', 'string'],
            'markets.*.response_notes' => ['nullable', 'string'],
        ]);

        $this->placementService->updatePlacement($placement, $validated);

        return to_route('placements.show', $placement);
    }

    public function destroy(Placement $placement): RedirectResponse
    {
        $this->placementService->deletePlacement($placement);

        return to_route('placements.index');
    }

    public function submitToMarket(Placement $placement): RedirectResponse
    {
        $this->placementService->submitToMarket($placement);

        return to_route('placements.show', $placement);
    }

    public function convertToPolicy(Placement $placement): RedirectResponse
    {
        $policy = $this->placementService->convertToPolicy($placement);

        return to_route('policy-management.show', $policy);
    }
}
