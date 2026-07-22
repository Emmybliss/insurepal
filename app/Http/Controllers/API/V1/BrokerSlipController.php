<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BrokerSlipStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreBrokerSlipRequest;
use App\Http\Requests\Api\V1\UpdateBrokerSlipRequest;
use App\Http\Resources\Api\V1\BrokerSlipCollection;
use App\Http\Resources\Api\V1\BrokerSlipResource;
use App\Http\Responses\ApiResponse;
use App\Models\BrokerSlip;
use App\Services\BrokerSlipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrokerSlipController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BrokerSlipService $brokerSlipService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = BrokerSlip::forTenant($tenantId)
            ->with(['placement.customer', 'placementMarket.insuranceCompany', 'createdBy']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('slip_number', 'like', "%{$search}%")
                    ->orWhereHas('placement.customer', function ($cq) use ($search) {
                        $cq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        if ($placementId = $request->placement_id) {
            $query->where('placement_id', $placementId);
        }

        if ($customerId = $request->customer_id) {
            $query->whereHas('placement', function ($q) use ($customerId) {
                $q->where('customer_id', $customerId);
            });
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'slip_number', 'version', 'status', 'sum_insured', 'created_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $slips = $query->paginate($perPage);

        return BrokerSlipCollection::make($slips)->response();
    }

    public function store(StoreBrokerSlipRequest $request): JsonResponse
    {
        try {
            $slip = $this->brokerSlipService->createSlip($request->user(), $request->validated());

            return $this->respondCreated(
                new BrokerSlipResource($slip),
                'Broker slip created successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function show(Request $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $brokerSlip->load([
            'placement.customer',
            'placementMarket.insuranceCompany',
            'items' => fn ($q) => $q->orderBy('sort_order'),
            'clauses' => fn ($q) => $q->orderBy('sort_order'),
            'versions' => fn ($q) => $q->latest(),
            'approvals' => fn ($q) => $q->latest(),
            'emailLogs' => fn ($q) => $q->latest(),
            'createdBy',
            'issuedBy',
            'approvedBy',
            'reviewedBy',
            'signedBy',
        ]);

        return $this->respond(new BrokerSlipResource($brokerSlip));
    }

    public function update(UpdateBrokerSlipRequest $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $slip = $this->brokerSlipService->updateSlip($brokerSlip, $request->validated());

            return $this->respond(
                new BrokerSlipResource($slip),
                'Broker slip updated successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function destroy(Request $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! $brokerSlip->isDraft()) {
            return $this->respondError('Only draft broker slips can be deleted.', 422);
        }

        $brokerSlip->delete();

        return $this->respondNoContent('Broker slip deleted successfully.');
    }

    public function submitForReview(Request $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['notes' => ['nullable', 'string']]); // single field — leave inline

        try {
            $this->brokerSlipService->submitForReview($brokerSlip, $request->user(), $request->notes);

            return $this->respond(
                new BrokerSlipResource($brokerSlip->fresh()->load(['placement.customer', 'placementMarket.insuranceCompany', 'createdBy', 'approvals'])),
                'Broker slip submitted for review.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function approve(Request $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($brokerSlip->status !== BrokerSlipStatus::PendingReview->value) {
            return $this->respondError('Only broker slips pending review can be approved.', 422);
        }

        $request->validate(['notes' => ['nullable', 'string']]); // single field — leave inline

        try {
            $approval = $brokerSlip->approvals()->latest()->firstOrFail();
            $approval->approve($request->notes);

            return $this->respond(
                new BrokerSlipResource($brokerSlip->fresh()->load(['placement.customer', 'placementMarket.insuranceCompany', 'approvals'])),
                'Broker slip approved.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function requestChanges(Request $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($brokerSlip->status !== BrokerSlipStatus::PendingReview->value) {
            return $this->respondError('Only broker slips pending review can have changes requested.', 422);
        }

        $request->validate(['changes' => ['required', 'string']]); // single field — leave inline

        try {
            $approval = $brokerSlip->approvals()->latest()->firstOrFail();
            $approval->requestChanges($request->changes);

            return $this->respond(
                new BrokerSlipResource($brokerSlip->fresh()->load(['placement.customer', 'placementMarket.insuranceCompany', 'approvals'])),
                'Changes requested for broker slip.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function issue(Request $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $slip = $this->brokerSlipService->issueSlip($brokerSlip, $request->user());

            return $this->respond(
                new BrokerSlipResource($slip),
                'Broker slip issued successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function withdraw(Request $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $slip = $this->brokerSlipService->withdrawSlip($brokerSlip);

            return $this->respond(
                new BrokerSlipResource($slip),
                'Broker slip withdrawn.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function createVersion(Request $request, BrokerSlip $brokerSlip): JsonResponse
    {
        if ($brokerSlip->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $newSlip = $this->brokerSlipService->createNewVersion($brokerSlip);

            return $this->respondCreated(
                new BrokerSlipResource($newSlip),
                'New broker slip version created.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }
}
