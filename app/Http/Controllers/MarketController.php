<?php

namespace App\Http\Controllers;

use App\Models\InsuranceCompany;
use App\Models\Placement;
use App\Models\PlacementMarket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MarketController extends Controller
{
    public function store(Request $request, Placement $placement): RedirectResponse
    {
        $validated = $request->validate([
            'insurance_company_id' => ['required', 'exists:insurance_companies,id'],
            'insurer_branch' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['nullable', 'email', 'max:100'],
            'is_lead' => ['nullable', 'boolean'],
            'participation_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

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

    public function update(Request $request, Placement $placement, PlacementMarket $market): RedirectResponse
    {
        $validated = $request->validate([
            'insurance_company_id' => ['sometimes', 'exists:insurance_companies,id'],
            'insurer_branch' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['nullable', 'email', 'max:100'],
            'is_lead' => ['nullable', 'boolean'],
            'participation_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'offered_rate' => ['nullable', 'numeric', 'min:0'],
            'rate_basis' => ['nullable', 'string', 'in:percentage,per_mille,fixed'],
            'gross_premium' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status' => ['nullable', 'string', 'in:pending,accepted,countered,declined,withdrawn'],
            'response_notes' => ['nullable', 'string'],
        ]);

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
