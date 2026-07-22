<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Services\Policies\PolicyListingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    public function __construct(
        protected PolicyListingService $policyListingService
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
            'sort' => '-created_at',
        ], fn ($value) => $value !== null && $value !== '');

        $policies = $this->policyListingService->list($user, $filters, $request->per_page ?? 20);

        $policies->getCollection()->transform(function ($policy) {
            $expiryStatus = 'active';
            if ($policy->expiry_date) {
                if ($policy->expiry_date->isPast()) {
                    $expiryStatus = 'expired';
                } elseif ($policy->expiry_date->diffInDays(now()) <= 30) {
                    $expiryStatus = 'expiring_soon';
                }
            }

            return [
                'id' => $policy->id,
                'policy_number' => $policy->policy_number,
                'status' => $policy->status,
                'expiry_status' => $expiryStatus,
                'customer' => [
                    'id' => $policy->customer?->id,
                    'name' => $policy->customer?->display_name,
                    'type' => $policy->customer?->type,
                ],
                'product_name' => $policy->policyProduct?->name,
                'premium_amount' => $policy->premium_amount,
                'effective_date' => $policy->effective_date?->toISOString(),
                'expiry_date' => $policy->expiry_date?->toISOString(),
                'created_at' => $policy->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Policies fetched successfully',
            'data' => $policies->items(),
            'meta' => [
                'current_page' => $policies->currentPage(),
                'per_page' => $policies->perPage(),
                'total' => $policies->total(),
                'last_page' => $policies->lastPage(),
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

        $policy = $tenant->policies()
            ->with([
                'customer:id,type,first_name,last_name,company_name,email,phone,address,city,state',
                'policyProduct:id,name,code',
                'policyType:id,name',
                'policyClass:id,name',
            ])
            ->findOrFail($id);

        $documents = $policy->documents()
            ->select('id', 'name', 'file_path', 'file_type', 'created_at')
            ->limit(10)
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'name' => $d->name,
                'file_path' => $d->file_path ? asset('storage/'.$d->file_path) : null,
                'file_type' => $d->file_type,
                'created_at' => $d->created_at->toISOString(),
            ]);

        $debitNotes = $policy->debitNotes()
            ->select('id', 'note_number', 'status', 'amount', 'due_date')
            ->limit(5)
            ->get()
            ->map(fn ($dn) => [
                'id' => $dn->id,
                'note_number' => $dn->note_number,
                'status' => $dn->status,
                'amount' => $dn->amount,
                'due_date' => $dn->due_date?->toISOString(),
            ]);

        $expiryStatus = 'active';
        if ($policy->expiry_date) {
            if ($policy->expiry_date->isPast()) {
                $expiryStatus = 'expired';
            } elseif ($policy->expiry_date->diffInDays(now()) <= 30) {
                $expiryStatus = 'expiring_soon';
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Policy fetched successfully',
            'data' => [
                'id' => $policy->id,
                'policy_number' => $policy->policy_number,
                'status' => $policy->status,
                'approval_status' => $policy->approval_status,
                'expiry_status' => $expiryStatus,
                'customer' => [
                    'id' => $policy->customer?->id,
                    'type' => $policy->customer?->type,
                    'name' => $policy->customer?->display_name,
                    'email' => $policy->customer?->email,
                    'phone' => $policy->customer?->phone,
                    'address' => $policy->customer?->address,
                    'city' => $policy->customer?->city,
                    'state' => $policy->customer?->state,
                ],
                'product' => $policy->policyProduct ? [
                    'id' => $policy->policyProduct->id,
                    'name' => $policy->policyProduct->name,
                    'code' => $policy->policyProduct->code,
                ] : null,
                'type' => $policy->policyType?->name,
                'class' => $policy->policyClass?->name,
                'premium_amount' => $policy->premium_amount,
                'commission_amount' => $policy->commission_amount,
                'total_amount' => $policy->total_amount,
                'payment_frequency' => $policy->payment_frequency,
                'effective_date' => $policy->effective_date?->toISOString(),
                'expiry_date' => $policy->expiry_date?->toISOString(),
                'coverage_details' => $policy->coverage_details,
                'terms_conditions' => $policy->terms_conditions,
                'notes' => $policy->notes,
                'insurer_name' => $policy->insurer_name,
                'insurer_email' => $policy->insurer_email,
                'insurer_phone' => $policy->insurer_phone,
                'issued_at' => $policy->issued_at?->toISOString(),
                'renewed_at' => $policy->renewed_at?->toISOString(),
                'created_at' => $policy->created_at->toISOString(),
                'documents' => $documents,
                'debit_notes' => $debitNotes,
            ],
        ]);
    }
}
