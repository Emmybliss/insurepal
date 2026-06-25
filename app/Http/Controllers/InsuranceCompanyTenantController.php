<?php

namespace App\Http\Controllers;

use App\Models\InsuranceCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InsuranceCompanyTenantController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $tenant = app('tenant');

        $companies = $tenant->insuranceCompanies()
            ->withPivot(['id', 'insurance_company_branch_id', 'reference_code', 'is_preferred'])
            ->leftJoin('insurance_company_branches', 'insurance_company_tenant.insurance_company_branch_id', '=', 'insurance_company_branches.id')
            ->where('insurance_companies.is_active', true)
            ->select([
                'insurance_companies.id',
                'insurance_companies.name as company_name',
                'insurance_companies.company_type',
                'insurance_companies.email',
                'insurance_companies.phone',
                'insurance_companies.naicom_reg_number',
                'insurance_companies.rc_number',
                'insurance_company_branches.name as branch_name',
                'insurance_company_branches.id as branch_id',
                'insurance_company_tenant.id as pivot_id',
                'insurance_company_tenant.reference_code',
                'insurance_company_tenant.is_preferred',
            ])
            ->orderBy('insurance_companies.name')
            ->get()
            ->map(function ($item) {
                $branchName = $item->branch_name ?? 'Default';

                return [
                    'id' => (string) $item->pivot_id,
                    'source' => 'tenant',
                    'name' => $item->branch_name ? $item->company_name.' — '.$item->branch_name : $item->company_name,
                    'company_name' => $item->company_name,
                    'branch_name' => $branchName,
                    'company_id' => (string) $item->id,
                    'branch_id' => $item->branch_id ? (string) $item->branch_id : null,
                    'email' => $item->email,
                    'phone' => $item->phone,
                    'naicom_reg_number' => $item->naicom_reg_number,
                    'rc_number' => $item->rc_number,
                    'reference_code' => $item->reference_code,
                    'is_preferred' => (bool) $item->is_preferred,
                ];
            });

        if ($request->header('X-Inertia')) {
            return Inertia::render('settings/InsuranceCompanies', [
                'companies' => $companies,
            ]);
        }

        return response()->json($companies);
    }

    public function registry(Request $request): JsonResponse
    {
        $query = $request->get('q');
        $type = $request->get('type', 'all');

        $companies = InsuranceCompany::query()
            ->active()
            ->byType($type)
            ->when($query && strlen($query) >= 2, fn ($q) => $q->where('name', 'like', "%{$query}%"))
            ->orderBy('name')
            ->limit(20)
            ->get();

        $result = [];
        foreach ($companies as $company) {
            $branches = $company->branches()
                ->active()
                ->when($query && strlen($query) >= 2, fn ($q) => $q->where('name', 'like', "%{$query}%"))
                ->orderBy('name')
                ->get();

            if ($branches->isEmpty()) {
                $result[] = [
                    'id' => (string) $company->id,
                    'source' => 'registry',
                    'name' => $company->name,
                    'company_id' => (string) $company->id,
                    'company_name' => $company->name,
                    'branch' => null,
                    'has_branches' => false,
                    'email' => $company->email,
                    'phone' => $company->phone,
                ];
            } else {
                foreach ($branches as $branch) {
                    $result[] = [
                        'id' => (string) $company->id.'-'.$branch->id,
                        'source' => 'registry',
                        'name' => $company->name.' — '.$branch->name,
                        'company_id' => (string) $company->id,
                        'company_name' => $company->name,
                        'branch' => [
                            'id' => (string) $branch->id,
                            'name' => $branch->name,
                        ],
                        'has_branches' => true,
                        'email' => $company->email,
                        'phone' => $company->phone,
                    ];
                }
            }
        }

        return response()->json($result);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenant = app('tenant');

        $validated = $request->validate([
            'insurance_company_id' => ['required', 'exists:insurance_companies,id'],
            'insurance_company_branch_id' => [
                'nullable',
                'exists:insurance_company_branches,id',
            ],
            'reference_code' => ['nullable', 'string', 'max:100'],
            'is_preferred' => ['boolean'],
        ]);

        $alreadySaved = DB::table('insurance_company_tenant')
            ->where('tenant_id', $tenant->id)
            ->where('insurance_company_id', $validated['insurance_company_id'])
            ->where(function ($q) use ($validated) {
                if ($validated['insurance_company_branch_id']) {
                    $q->where('insurance_company_branch_id', $validated['insurance_company_branch_id']);
                } else {
                    $q->whereNull('insurance_company_branch_id');
                }
            })
            ->exists();

        if ($alreadySaved) {
            return redirect()->back()->withErrors([
                'insurance_company_branch_id' => 'This company branch is already saved under your tenancy.',
            ]);
        }

        $tenant->insuranceCompanies()->attach($validated['insurance_company_id'], [
            'insurance_company_branch_id' => $validated['insurance_company_branch_id'],
            'reference_code' => $validated['reference_code'] ?? null,
            'is_preferred' => $validated['is_preferred'] ?? false,
        ]);

        return redirect()->back()->with('success', 'Insurance company added successfully');
    }

    public function update(Request $request, int $pivotId): RedirectResponse
    {
        $tenant = app('tenant');

        $pivot = $tenant->insuranceCompanies()
            ->wherePivot('id', $pivotId)
            ->first();

        if (! $pivot) {
            return redirect()->back()->with('error', 'Record not found.');
        }

        $validated = $request->validate([
            'reference_code' => ['nullable', 'string', 'max:100'],
            'is_preferred' => ['boolean'],
        ]);

        $tenant->insuranceCompanies()->updateExistingPivot($pivot->id, $validated);

        return redirect()->back()->with('success', 'Insurance company updated successfully');
    }

    public function destroy(int $pivotId): RedirectResponse
    {
        $tenant = app('tenant');

        $pivot = $tenant->insuranceCompanies()
            ->wherePivot('id', $pivotId)
            ->first();

        if (! $pivot) {
            return redirect()->back()->with('error', 'Record not found.');
        }

        $tenant->insuranceCompanies()->detach($pivot->id);

        return redirect()->back()->with('success', 'Insurance company removed successfully');
    }
}
