<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreInsuranceCompanyBranchRequest;
use App\Http\Requests\Api\V1\StoreInsuranceCompanyContactRequest;
use App\Http\Requests\Api\V1\StoreInsuranceCompanyRequest;
use App\Http\Requests\Api\V1\UpdateInsuranceCompanyBranchRequest;
use App\Http\Requests\Api\V1\UpdateInsuranceCompanyContactRequest;
use App\Http\Requests\Api\V1\UpdateInsuranceCompanyRequest;
use App\Http\Resources\Api\V1\InsuranceCompanyBranchResource;
use App\Http\Resources\Api\V1\InsuranceCompanyCollection;
use App\Http\Resources\Api\V1\InsuranceCompanyContactResource;
use App\Http\Resources\Api\V1\InsuranceCompanyResource;
use App\Http\Responses\ApiResponse;
use App\Models\InsuranceCompany;
use App\Models\InsuranceCompanyBranch;
use App\Models\InsuranceCompanyContact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsuranceCompanyController extends Controller
{
    use ApiResponse;

    // ─── Companies ───

    public function index(Request $request): JsonResponse
    {
        $query = InsuranceCompany::query();

        if ($search = $request->search) {
            $query->search($search);
        }

        if ($type = $request->type) {
            if ($type === 'all') {
                // no filter
            } elseif ($type === 'underwriter' || $type === 'broker') {
                $query->where(function ($q) use ($type) {
                    $q->where('company_type', $type)
                        ->orWhere('company_type', 'both');
                });
            }
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'name', 'company_type', 'email', 'created_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $companies = $query->paginate($perPage);

        return InsuranceCompanyCollection::make($companies)->response();
    }

    public function store(StoreInsuranceCompanyRequest $request): JsonResponse
    {
        $company = InsuranceCompany::create($request->validated());

        return $this->respondCreated(
            new InsuranceCompanyResource($company),
            'Insurance company created successfully.'
        );
    }

    public function show(Request $request, InsuranceCompany $insuranceCompany): JsonResponse
    {
        $insuranceCompany->load(['branches', 'contacts']);

        return $this->respond(new InsuranceCompanyResource($insuranceCompany));
    }

    public function update(UpdateInsuranceCompanyRequest $request, InsuranceCompany $insuranceCompany): JsonResponse
    {
        $insuranceCompany->update($request->validated());

        return $this->respond(
            new InsuranceCompanyResource($insuranceCompany),
            'Insurance company updated successfully.'
        );
    }

    public function destroy(Request $request, InsuranceCompany $insuranceCompany): JsonResponse
    {
        $insuranceCompany->delete();

        return $this->respondNoContent('Insurance company deleted successfully.');
    }

    // ─── Branches ───

    public function indexBranches(Request $request, InsuranceCompany $insuranceCompany): JsonResponse
    {
        $branches = $insuranceCompany->branches()->orderBy('name')->get();

        return $this->respond(InsuranceCompanyBranchResource::collection($branches));
    }

    public function storeBranch(StoreInsuranceCompanyBranchRequest $request, InsuranceCompany $insuranceCompany): JsonResponse
    {
        $branch = $insuranceCompany->branches()->create($request->validated());

        return $this->respondCreated(
            new InsuranceCompanyBranchResource($branch),
            'Branch created successfully.'
        );
    }

    public function showBranch(Request $request, InsuranceCompany $insuranceCompany, InsuranceCompanyBranch $branch): JsonResponse
    {
        if ($branch->insurance_company_id !== $insuranceCompany->id) {
            return $this->respondNotFound();
        }

        return $this->respond(new InsuranceCompanyBranchResource($branch));
    }

    public function updateBranch(UpdateInsuranceCompanyBranchRequest $request, InsuranceCompany $insuranceCompany, InsuranceCompanyBranch $branch): JsonResponse
    {
        if ($branch->insurance_company_id !== $insuranceCompany->id) {
            return $this->respondNotFound();
        }

        $branch->update($request->validated());

        return $this->respond(
            new InsuranceCompanyBranchResource($branch),
            'Branch updated successfully.'
        );
    }

    public function destroyBranch(Request $request, InsuranceCompany $insuranceCompany, InsuranceCompanyBranch $branch): JsonResponse
    {
        if ($branch->insurance_company_id !== $insuranceCompany->id) {
            return $this->respondNotFound();
        }

        $branch->delete();

        return $this->respondNoContent('Branch deleted successfully.');
    }

    // ─── Contacts ───

    public function indexContacts(Request $request, InsuranceCompany $insuranceCompany): JsonResponse
    {
        $contacts = $insuranceCompany->contacts()->orderBy('is_primary', 'desc')->orderBy('first_name')->get();

        return $this->respond(InsuranceCompanyContactResource::collection($contacts));
    }

    public function storeContact(StoreInsuranceCompanyContactRequest $request, InsuranceCompany $insuranceCompany): JsonResponse
    {
        $contact = $insuranceCompany->contacts()->create($request->validated());

        return $this->respondCreated(
            new InsuranceCompanyContactResource($contact),
            'Contact created successfully.'
        );
    }

    public function showContact(Request $request, InsuranceCompany $insuranceCompany, InsuranceCompanyContact $contact): JsonResponse
    {
        if ($contact->insurance_company_id !== $insuranceCompany->id) {
            return $this->respondNotFound();
        }

        return $this->respond(new InsuranceCompanyContactResource($contact));
    }

    public function updateContact(UpdateInsuranceCompanyContactRequest $request, InsuranceCompany $insuranceCompany, InsuranceCompanyContact $contact): JsonResponse
    {
        if ($contact->insurance_company_id !== $insuranceCompany->id) {
            return $this->respondNotFound();
        }

        $contact->update($request->validated());

        return $this->respond(
            new InsuranceCompanyContactResource($contact),
            'Contact updated successfully.'
        );
    }

    public function destroyContact(Request $request, InsuranceCompany $insuranceCompany, InsuranceCompanyContact $contact): JsonResponse
    {
        if ($contact->insurance_company_id !== $insuranceCompany->id) {
            return $this->respondNotFound();
        }

        $contact->delete();

        return $this->respondNoContent('Contact deleted successfully.');
    }
}
