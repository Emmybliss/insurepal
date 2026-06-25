<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->tenant->quotes();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('quote_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('customer_id') && $request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        $quotes = $query->with(['customer:id,first_name,last_name,company_name,type', 'policyProduct:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

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
                'product_name' => $quote->policyProduct?->name,
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
        $quote = $request->tenant->quotes()
            ->with([
                'customer:id,type,first_name,last_name,company_name,email,phone,address,city,state',
                'policyProduct:id,name,code',
                'policyType:id,name',
                'policyClass:id,name',
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
                'product' => $quote->policyProduct ? [
                    'id' => $quote->policyProduct->id,
                    'name' => $quote->policyProduct->name,
                    'code' => $quote->policyProduct->code,
                ] : null,
                'type' => $quote->policyType?->name,
                'class' => $quote->policyClass?->name,
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
