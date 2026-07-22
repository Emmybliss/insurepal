<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreInsuranceCompanyRequest;
use App\Http\Requests\SuperAdmin\UpdateInsuranceCompanyRequest;
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

    public function store(StoreInsuranceCompanyRequest $request): RedirectResponse
    {
        InsuranceCompany::create($request->validated());

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

    public function update(UpdateInsuranceCompanyRequest $request, InsuranceCompany $insuranceCompany): RedirectResponse
    {
        $insuranceCompany->update($request->validated());

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
