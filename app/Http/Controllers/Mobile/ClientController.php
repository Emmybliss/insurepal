<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found',
            ], 422);
        }

        $query = $tenant->customers();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && $request->status) {
            $query->where('is_active', $request->status === 'active');
        }

        $clients = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        $clients->getCollection()->transform(fn ($client) => [
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
            'data' => $clients->items(),
            'meta' => [
                'current_page' => $clients->currentPage(),
                'per_page' => $clients->perPage(),
                'total' => $clients->total(),
                'last_page' => $clients->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found',
            ], 422);
        }

        $validated = $request->validate([
            'type' => ['required', Rule::in(['individual', 'corporate'])],
            'first_name' => ['required_if:type,individual', 'nullable', 'string', 'max:255'],
            'last_name' => ['required_if:type,individual', 'nullable', 'string', 'max:255'],
            'company_name' => ['required_if:type,corporate', 'nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'occupation' => ['nullable', 'string', 'max:255'],
        ]);

        $existingCustomer = $tenant->customers()
            ->where('email', $validated['email'])
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
            ...$validated,
            'is_active' => true,
            'user_id' => $request->user()->id,
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
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found',
            ], 422);
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

    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found',
            ], 422);
        }

        $customer = $tenant->customers()->findOrFail($id);

        $validated = $request->validate([
            'type' => ['sometimes', Rule::in(['individual', 'corporate'])],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'occupation' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $customer->update($validated);

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
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found',
            ], 422);
        }

        $customer = $tenant->customers()->findOrFail($id);

        if ($customer->policies()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete client with associated policies',
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Client deleted successfully',
        ]);
    }
}
