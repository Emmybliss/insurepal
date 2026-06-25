<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInsuranceCompanyBranchRequest;
use App\Models\InsuranceCompany;
use App\Models\InsuranceCompanyBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class InsuranceCompanyBranchController extends Controller
{
    public function index(Request $request, InsuranceCompany $insuranceCompany): InertiaResponse
    {
        $branches = $insuranceCompany->branches()
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/InsuranceCompanies/Branches', [
            'company' => $insuranceCompany->loadCount('branches'),
            'branches' => $branches,
        ]);
    }

    public function store(StoreInsuranceCompanyBranchRequest $request, InsuranceCompany $insuranceCompany): RedirectResponse
    {
        $insuranceCompany->branches()->create($request->validated());

        return redirect()->route('admin.insurance-companies.branches.index', $insuranceCompany)
            ->with('success', 'Branch created successfully');
    }

    public function update(StoreInsuranceCompanyBranchRequest $request, InsuranceCompany $insuranceCompany, InsuranceCompanyBranch $branch): RedirectResponse
    {
        $branch->update($request->validated());

        return redirect()->route('admin.insurance-companies.branches.index', $insuranceCompany)
            ->with('success', 'Branch updated successfully');
    }

    public function destroy(InsuranceCompany $insuranceCompany, InsuranceCompanyBranch $branch): RedirectResponse
    {
        $branch->delete();

        return redirect()->route('admin.insurance-companies.branches.index', $insuranceCompany)
            ->with('success', 'Branch deleted successfully');
    }

    public function toggle(InsuranceCompany $insuranceCompany, InsuranceCompanyBranch $branch): RedirectResponse
    {
        $branch->update(['is_active' => ! $branch->is_active]);

        return redirect()->back()->with(
            'success',
            $branch->is_active ? 'Branch activated' : 'Branch deactivated'
        );
    }
}
