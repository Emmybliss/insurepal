<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCustomerRequest;
use App\Http\Requests\Api\V1\UpdateCustomerRequest;
use App\Http\Resources\Api\V1\CustomerCollection;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Http\Responses\ApiResponse;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use ApiResponse;

    public function __construct(
        private CustomerService $customerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $customers = Customer::forTenant($tenantId)
            ->with(['user', 'kyc', 'quotes', 'policies', 'claims'])
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $customers->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $customers->where('type', $request->type);
        }

        if ($request->filled('is_active')) {
            $customers->where('is_active', $request->boolean('is_active'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $paginated = $customers->paginate($perPage);

        return CustomerCollection::make($paginated)->response();
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $tenantId = $request->user()->tenant_id;

        $result = $this->customerService->createCustomer($tenantId, $validated);

        return $this->respondCreated(
            new CustomerResource($result['customer']->load(['user'])),
            'Customer created successfully.'
        );
    }

    public function show(Request $request, Customer $customer): JsonResponse
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $customer->load([
            'user',
            'kyc',
            'quotes' => fn ($q) => $q->latest(),
            'policies' => fn ($q) => $q->latest(),
            'claims' => fn ($q) => $q->latest(),
        ]);

        return $this->respond(new CustomerResource($customer));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $customer->update($request->validated());
        $customer->load(['user']);

        return $this->respond(
            new CustomerResource($customer),
            'Customer updated successfully.'
        );
    }

    public function destroy(Request $request, Customer $customer): JsonResponse
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($customer->user_id) {
            $customer->user?->delete();
        }

        $customer->delete();

        return $this->respondNoContent('Customer deleted successfully.');
    }

    public function provisionAccess(Request $request, Customer $customer): JsonResponse
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['send_email' => 'boolean']);

        try {
            $this->customerService->provisionLoginAccess($customer, $request->boolean('send_email'));

            return $this->respond(
                new CustomerResource($customer->load(['user'])),
                'Login access provisioned successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to provision access: '.$e->getMessage(), 422);
        }
    }

    public function revokeAccess(Request $request, Customer $customer): JsonResponse
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->customerService->revokeLoginAccess($customer);

            return $this->respond(
                new CustomerResource($customer),
                'Login access revoked successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to revoke access: '.$e->getMessage(), 422);
        }
    }

    public function resetPassword(Request $request, Customer $customer): JsonResponse
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->customerService->resetCustomerPassword($customer);

            return $this->respond(
                new CustomerResource($customer),
                'Password reset successfully. New credentials sent to the customer.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to reset password: '.$e->getMessage(), 422);
        }
    }
}
