<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CustomerLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerLookupController extends Controller
{
    public function __construct(
        protected CustomerLookupService $lookupService
    ) {}

    public function search(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $request->get('query');
        $limit = (int) $request->get('limit', 20);

        $customers = $this->lookupService->search($user->tenant_id, $query, $limit);

        return response()->json($customers->map(fn ($customer) => [
            'id' => $customer->id,
            'display_name' => $customer->display_name,
            'type' => $customer->type,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'company_name' => $customer->company_name,
            'email' => $customer->email,
            'phone' => $customer->phone,
        ]));
    }

    public function quickStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'type' => 'nullable|string|in:individual,corporate',
        ]);

        if (empty($validated['first_name']) && empty($validated['last_name']) && empty($validated['company_name'])) {
            return response()->json([
                'message' => 'Please provide at least a customer name or company name.',
                'errors' => ['first_name' => ['At least a name or company name is required.']],
            ], 422);
        }

        $user = $request->user();
        $customer = $this->lookupService->quickCreate($user->tenant_id, $validated);

        return response()->json([
            'message' => 'Customer created successfully.',
            'customer' => [
                'id' => $customer->id,
                'display_name' => $customer->display_name,
                'type' => $customer->type,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'company_name' => $customer->company_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
            ],
        ], 201);
    }
}
