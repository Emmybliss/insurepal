<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mobile\ClientStoreRequest;
use App\Http\Requests\Mobile\ClientUpdateRequest;
use App\Services\Customers\CustomerListingService;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct(
        private CustomerService $customerService,
        private CustomerListingService $customerListingService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return $this->error('No tenant found');
        }

        $filters = $request->only(['search', 'type']);

        if ($request->has('status') && $request->status) {
            $filters['is_active'] = $request->status === 'active';
        }

        $customers = $this->customerListingService->list(
            $user,
            $filters,
            $request->per_page ?? 20
        );

        $customers->getCollection()->transform(fn ($client) => [
            'id' => $client->id,
            'type' => $client->type,
            'name' => $client->display_name,
            'email' => $client->email,
            'phone' => $client->phone,
            'address' => $client->address,
            'city' => $client->city,
            'state' => $client->state,
            'is_active' => $client->is_active,
            'created_at' => $client->created_at->toISOString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Clients fetched successfully',
            'data' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
                'last_page' => $customers->lastPage(),
            ],
        ]);
    }

    public function store(ClientStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return $this->error('No tenant found');
        }

        $existingCustomer = $tenant->customers()
            ->where('email', $request->email)
            ->first();

        if ($existingCustomer) {
            return response()->json([
                'success' => true,
                'message' => 'Customer already exists',
                'data' => [
                    'id' => $existingCustomer->id,
                    'type' => $existingCustomer->type,
                    'name' => $existingCustomer->display_name,
                    'email' => $existingCustomer->email,
                    'phone' => $existingCustomer->phone,
                ],
            ]);
        }

        $customer = $tenant->customers()->create([
            ...$request->validated(),
            'is_active' => true,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Client created successfully',
            'data' => [
                'id' => $customer->id,
                'type' => $customer->type,
                'name' => $customer->display_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'city' => $customer->city,
                'state' => $customer->state,
                'is_active' => $customer->is_active,
                'created_at' => $customer->created_at->toISOString(),
            ],
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $tenant = $request->user()->tenant;

        if (! $tenant) {
            return $this->error('No tenant found');
        }

        $customer = $tenant->customers()->findOrFail($id);

        $policies = $customer->policies()
            ->select('id', 'policy_number', 'status', 'premium_amount', 'effective_date', 'expiry_date')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'policy_number' => $p->policy_number,
                'status' => $p->status,
                'premium_amount' => $p->premium_amount,
                'effective_date' => $p->effective_date?->toISOString(),
                'expiry_date' => $p->expiry_date?->toISOString(),
            ]);

        $claims = $customer->claims()
            ->select('id', 'claim_reference', 'status', 'claim_amount', 'incident_date')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'claim_reference' => $c->claim_reference,
                'status' => $c->status,
                'claim_amount' => $c->claim_amount,
                'incident_date' => $c->incident_date?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Client fetched successfully',
            'data' => [
                'id' => $customer->id,
                'type' => $customer->type,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'company_name' => $customer->company_name,
                'name' => $customer->display_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'city' => $customer->city,
                'state' => $customer->state,
                'country' => $customer->country,
                'date_of_birth' => $customer->date_of_birth?->toISOString(),
                'gender' => $customer->gender,
                'occupation' => $customer->occupation,
                'is_active' => $customer->is_active,
                'created_at' => $customer->created_at->toISOString(),
                'policies' => $policies,
                'claims' => $claims,
            ],
        ]);
    }

    public function update(ClientUpdateRequest $request, string $id): JsonResponse
    {
        $tenant = $request->user()->tenant;

        if (! $tenant) {
            return $this->error('No tenant found');
        }

        $customer = $tenant->customers()->findOrFail($id);
        $customer->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Client updated successfully',
            'data' => [
                'id' => $customer->id,
                'type' => $customer->type,
                'name' => $customer->display_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'is_active' => $customer->is_active,
            ],
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $tenant = $request->user()->tenant;

        if (! $tenant) {
            return $this->error('No tenant found');
        }

        $customer = $tenant->customers()->findOrFail($id);

        if ($customer->policies()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete client with associated policies',
            ], 422);
        }

        $this->customerService->deleteCustomer($customer);

        return response()->json([
            'success' => true,
            'message' => 'Client deleted successfully',
        ]);
    }

    private function error(string $message): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], 422);
    }
}
