<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\InsuranceCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class InsuranceCompanyController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $companies = InsuranceCompany::query()
            ->withCount('branches')
            ->search($request->get('search'))
            ->filterByType($request->get('type'))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/InsuranceCompanies/Index', [
            'companies' => $companies,
            'filters' => [
                'search' => $request->get('search'),
                'type' => $request->get('type'),
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('Admin/InsuranceCompanies/Create', [
            'company' => null,
            'isEditing' => false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_type' => 'required|in:underwriter,broker,both',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'naicom_reg_number' => 'nullable|string|max:100',
            'ncrib_reg_number' => 'nullable|string|max:100',
            'rc_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        InsuranceCompany::create($validated);

        return redirect()->route('admin.insurance-companies.index')
            ->with('success', 'Insurance company created successfully');
    }

    public function show(InsuranceCompany $insuranceCompany): InertiaResponse
    {
        return Inertia::render('Admin/InsuranceCompanies/Show', [
            'company' => $insuranceCompany,
        ]);
    }

    public function edit(InsuranceCompany $insuranceCompany): InertiaResponse
    {
        return Inertia::render('Admin/InsuranceCompanies/Edit', [
            'company' => $insuranceCompany,
            'isEditing' => true,
        ]);
    }

    public function update(Request $request, InsuranceCompany $insuranceCompany): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_type' => 'required|in:underwriter,broker,both',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'naicom_reg_number' => 'nullable|string|max:100',
            'ncrib_reg_number' => 'nullable|string|max:100',
            'rc_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $insuranceCompany->update($validated);

        return redirect()->route('admin.insurance-companies.index')
            ->with('success', 'Insurance company updated successfully');
    }

    public function destroy(InsuranceCompany $insuranceCompany): RedirectResponse
    {
        $insuranceCompany->delete();

        return redirect()->route('admin.insurance-companies.index')
            ->with('success', 'Insurance company deleted successfully');
    }

    public function toggle(InsuranceCompany $insuranceCompany): RedirectResponse
    {
        $insuranceCompany->update(['is_active' => ! $insuranceCompany->is_active]);

        $message = $insuranceCompany->is_active ? 'Company activated' : 'Company deactivated';

        return redirect()->back()->with('success', $message);
    }
}
