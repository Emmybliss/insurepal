<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClaimController extends Controller
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

        $query = Claim::query();

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('claim_reference', 'like', "%{$search}%")
                    ->orWhere('incident_description', 'like', "%{$search}%")
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

        if ($request->has('claim_type') && $request->claim_type) {
            $query->where('claim_type', $request->claim_type);
        }

        $claims = $query->with(['customer:id,first_name,last_name,company_name,type', 'policy:id,policy_number'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        $claims->getCollection()->transform(function ($claim) {
            return [
                'id' => $claim->id,
                'claim_reference' => $claim->claim_reference,
                'status' => $claim->status,
                'claim_type' => $claim->claim_type,
                'incident_date' => $claim->incident_date?->toISOString(),
                'claim_amount' => $claim->claim_amount,
                'approved_amount' => $claim->approved_amount,
                'customer' => [
                    'id' => $claim->customer?->id,
                    'name' => $claim->customer?->display_name,
                    'type' => $claim->customer?->type,
                ],
                'policy' => [
                    'id' => $claim->policy?->id,
                    'policy_number' => $claim->policy?->policy_number,
                ],
                'submitted_at' => $claim->submitted_at?->toISOString(),
                'created_at' => $claim->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Claims fetched successfully',
            'data' => $claims->items(),
            'meta' => [
                'current_page' => $claims->currentPage(),
                'per_page' => $claims->perPage(),
                'total' => $claims->total(),
                'last_page' => $claims->lastPage(),
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
            'policy_id' => ['required', 'exists:tenant_policies,id'],
            'customer_id' => ['required', 'exists:tenant_customers,id'],
            'claim_type' => ['required', Rule::in([
                Claim::TYPE_ACCIDENT,
                Claim::TYPE_THEFT,
                Claim::TYPE_DAMAGE,
                Claim::TYPE_FIRE,
                Claim::TYPE_FLOOD,
                Claim::TYPE_LIABILITY,
                Claim::TYPE_HEALTH,
                Claim::TYPE_OTHER,
            ])],
            'incident_date' => ['required', 'date'],
            'incident_description' => ['required', 'string', 'max:2000'],
            'incident_location' => ['nullable', 'string', 'max:500'],
            'claim_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $policy = $tenant->policies()->findOrFail($validated['policy_id']);

        if ($policy->customer_id != $validated['customer_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Policy does not belong to the specified customer',
            ], 422);
        }

        $claim = Claim::create([
            'tenant_id' => $tenant->id,
            'policy_id' => $validated['policy_id'],
            'customer_id' => $validated['customer_id'],
            'claim_reference' => Claim::generateClaimReference($tenant->id),
            'claim_type' => $validated['claim_type'],
            'incident_date' => $validated['incident_date'],
            'incident_description' => $validated['incident_description'],
            'incident_location' => $validated['incident_location'] ?? null,
            'claim_amount' => $validated['claim_amount'],
            'status' => Claim::STATUS_SUBMITTED,
            'submitted_by' => $request->user()->id,
            'submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Claim submitted successfully',
            'data' => [
                'id' => $claim->id,
                'claim_reference' => $claim->claim_reference,
                'status' => $claim->status,
                'claim_type' => $claim->claim_type,
                'incident_date' => $claim->incident_date?->toISOString(),
                'claim_amount' => $claim->claim_amount,
                'submitted_at' => $claim->submitted_at?->toISOString(),
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

        $claim = Claim::query()
            ->with([
                'customer:id,type,first_name,last_name,company_name,email,phone,address',
                'policy:id,policy_number,policyProduct',
                'documents',
                'comments.user:id,name',
            ])
            ->findOrFail($id);

        $activities = $claim->activities()
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'action' => $a->action,
                'description' => $a->description,
                'user' => $a->user?->name,
                'created_at' => $a->created_at->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Claim fetched successfully',
            'data' => [
                'id' => $claim->id,
                'claim_reference' => $claim->claim_reference,
                'status' => $claim->status,
                'claim_type' => $claim->claim_type,
                'incident_date' => $claim->incident_date?->toISOString(),
                'incident_description' => $claim->incident_description,
                'incident_location' => $claim->incident_location,
                'claim_amount' => $claim->claim_amount,
                'approved_amount' => $claim->approved_amount,
                'decision_notes' => $claim->decision_notes,
                'customer' => [
                    'id' => $claim->customer?->id,
                    'type' => $claim->customer?->type,
                    'name' => $claim->customer?->display_name,
                    'email' => $claim->customer?->email,
                    'phone' => $claim->customer?->phone,
                    'address' => $claim->customer?->address,
                ],
                'policy' => $claim->policy ? [
                    'id' => $claim->policy->id,
                    'policy_number' => $claim->policy->policy_number,
                    'product_name' => $claim->policy->policyProduct?->name,
                ] : null,
                'documents' => $claim->documents->map(fn ($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                    'file_path' => $d->file_path ? asset('storage/'.$d->file_path) : null,
                    'file_type' => $d->file_type,
                ]),
                'comments' => $claim->comments->map(fn ($c) => [
                    'id' => $c->id,
                    'comment' => $c->comment,
                    'user' => $c->user?->name,
                    'created_at' => $c->created_at->toISOString(),
                ]),
                'activities' => $activities,
                'submitted_at' => $claim->submitted_at?->toISOString(),
                'reviewed_at' => $claim->reviewed_at?->toISOString(),
                'approved_at' => $claim->approved_at?->toISOString(),
                'rejected_at' => $claim->rejected_at?->toISOString(),
                'settled_at' => $claim->settled_at?->toISOString(),
                'closed_at' => $claim->closed_at?->toISOString(),
                'created_at' => $claim->created_at->toISOString(),
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

        $claim = Claim::query()->findOrFail($id);

        if (! in_array($claim->status, [Claim::STATUS_DRAFT, Claim::STATUS_SUBMITTED])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot update claim in current status',
            ], 422);
        }

        $validated = $request->validate([
            'incident_date' => ['sometimes', 'date'],
            'incident_description' => ['sometimes', 'string', 'max:2000'],
            'incident_location' => ['nullable', 'string', 'max:500'],
            'claim_amount' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $claim->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Claim updated successfully',
            'data' => [
                'id' => $claim->id,
                'claim_reference' => $claim->claim_reference,
                'status' => $claim->status,
            ],
        ]);
    }
}
