<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMarketRequest;
use App\Http\Requests\UpdateMarketRequest;
use App\Models\InsuranceCompany;
use App\Models\Placement;
use App\Models\PlacementMarket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MarketController extends Controller
{
    public function store(StoreMarketRequest $request, Placement $placement): RedirectResponse
    {
        $validated = $request->validated();

        $market = $placement->markets()->create([
            'tenant_id' => $placement->tenant_id,
            'insurance_company_id' => $validated['insurance_company_id'],
            'insurer_branch' => $validated['insurer_branch'] ?? null,
            'contact_person' => $validated['contact_person'] ?? null,
            'contact_email' => $validated['contact_email'] ?? null,
            'is_lead' => $validated['is_lead'] ?? false,
            'participation_percentage' => $validated['participation_percentage'] ?? null,
            'status' => 'pending',
        ]);

        return to_route('placements.show', $placement);
    }

    public function update(UpdateMarketRequest $request, Placement $placement, PlacementMarket $market): RedirectResponse
    {
        $validated = $request->validated();

        $market->update($validated);

        return to_route('placements.show', $placement);
    }

    public function destroy(Placement $placement, PlacementMarket $market): RedirectResponse
    {
        $market->delete();

        return to_route('placements.show', $placement);
    }

    public function getInsuranceCompanies(Request $request): \Illuminate\Http\JsonResponse
    {
        $companies = InsuranceCompany::active()
            ->with('contacts')
            ->get(['id', 'name', 'company_type', 'email', 'phone', 'address', 'city', 'state']);

        return response()->json($companies);
    }
}
