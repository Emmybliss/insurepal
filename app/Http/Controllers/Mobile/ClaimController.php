<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mobile\StoreClaimRequest;
use App\Http\Requests\Mobile\UpdateClaimRequest;
use App\Models\Claim;
use App\Services\Claims\ClaimListingService;
use App\Services\Claims\RegisterClaimService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    public function __construct(
        protected ClaimListingService $claimListingService,
        protected RegisterClaimService $registerClaimService
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
            'claim_type' => $request->claim_type,
        ], fn ($value) => $value !== null && $value !== '');

        $claims = $this->claimListingService->list($user, $filters, $request->per_page ?? 20);

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

    public function store(StoreClaimRequest $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found',
            ], 422);
        }

        $validated = $request->validated();

        $policy = $tenant->policies()->findOrFail($validated['policy_id']);

        if ($policy->customer_id != $validated['customer_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Policy does not belong to the specified customer',
            ], 422);
        }

        $claim = $this->registerClaimService->register($validated, $user);

        $claim->update([
            'status' => Claim::STATUS_SUBMITTED,
            'submitted_by' => $user->id,
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

    public function update(UpdateClaimRequest $request, string $id): JsonResponse
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

        $this->registerClaimService->updateClaim($claim, $request->validated(), $user);

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
