<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function __construct(
        protected QuoteService $quoteService
    ) {}

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

        $filters = array_filter([
            'search' => $request->search,
            'status' => $request->status,
            'customer_id' => $request->customer_id,
        ], fn ($value) => $value !== null && $value !== '');

        $quotes = $this->quoteService->getQuotesForTenant($user, $filters, $request->per_page ?? 20);

        $quotes->getCollection()->transform(function ($quote) {
            return [
                'id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'status' => $quote->status,
                'customer' => [
                    'id' => $quote->customer?->id,
                    'name' => $quote->customer?->display_name,
                    'type' => $quote->customer?->type,
                ],
                'product_name' => $quote->insuranceProduct?->name,
                'premium_amount' => $quote->premium_amount,
                'valid_until' => $quote->valid_until?->toISOString(),
                'created_at' => $quote->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Quotes fetched successfully',
            'data' => $quotes->items(),
            'meta' => [
                'current_page' => $quotes->currentPage(),
                'per_page' => $quotes->perPage(),
                'total' => $quotes->total(),
                'last_page' => $quotes->lastPage(),
            ],
        ]);
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

        $quote = $tenant->quotes()
            ->with([
                'customer:id,type,first_name,last_name,company_name,email,phone,address,city,state',
                'insuranceProduct:id,name,code',
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Quote fetched successfully',
            'data' => [
                'id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'status' => $quote->status,
                'customer' => [
                    'id' => $quote->customer?->id,
                    'type' => $quote->customer?->type,
                    'name' => $quote->customer?->display_name,
                    'email' => $quote->customer?->email,
                    'phone' => $quote->customer?->phone,
                    'address' => $quote->customer?->address,
                    'city' => $quote->customer?->city,
                    'state' => $quote->customer?->state,
                ],
                'product' => $quote->insuranceProduct ? [
                    'id' => $quote->insuranceProduct->id,
                    'name' => $quote->insuranceProduct->name,
                    'code' => $quote->insuranceProduct->code,
                ] : null,
                'premium_amount' => $quote->premium_amount,
                'commission_amount' => $quote->commission_amount,
                'total_amount' => $quote->total_amount,
                'valid_until' => $quote->valid_until?->toISOString(),
                'coverage_details' => $quote->coverage_details,
                'notes' => $quote->notes,
                'created_at' => $quote->created_at->toISOString(),
            ],
        ]);
    }
}
