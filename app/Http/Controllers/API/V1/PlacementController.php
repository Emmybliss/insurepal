<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PlacementMarketStatus;
use App\Enums\PlacementStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RespondMarketRequest;
use App\Http\Requests\Api\V1\StorePlacementMarketRequest;
use App\Http\Requests\Api\V1\StorePlacementRequest;
use App\Http\Requests\Api\V1\UpdatePlacementMarketRequest;
use App\Http\Requests\Api\V1\UpdatePlacementRequest;
use App\Http\Resources\Api\V1\PlacementCollection;
use App\Http\Resources\Api\V1\PlacementMarketResource;
use App\Http\Resources\Api\V1\PlacementResource;
use App\Http\Responses\ApiResponse;
use App\Models\Placement;
use App\Models\PlacementMarket;
use App\Services\PlacementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlacementController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PlacementService $placementService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = Placement::forTenant($tenantId)
            ->with(['customer', 'policyProduct', 'createdBy', 'markets.insuranceCompany']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('placement_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        if ($customerId = $request->customer_id) {
            $query->where('customer_id', $customerId);
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->date_to) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'placement_number', 'status', 'total_sum_insured', 'created_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $placements = $query->paginate($perPage);

        return PlacementCollection::make($placements)->response();
    }

    public function store(StorePlacementRequest $request): JsonResponse
    {
        $user = $request->user();

        try {
            $placement = $this->placementService->createPlacement(
                array_merge($request->validated(), ['tenant_id' => $user->tenant_id])
            );

            return $this->respondCreated(
                new PlacementResource($placement),
                'Placement created successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function show(Request $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $placement->load([
            'customer',
            'insured',
            'policyProduct',
            'markets.insuranceCompany',
            'brokerSlips',
            'createdBy',
            'approvedBy',
        ]);

        return $this->respond(new PlacementResource($placement));
    }

    public function update(UpdatePlacementRequest $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($placement->status !== PlacementStatus::Draft->value) {
            return $this->respondError('Placement cannot be edited in current status.', 422);
        }

        $placement->update($request->validated());

        $placement->load(['customer', 'policyProduct', 'markets.insuranceCompany']);

        return $this->respond(
            new PlacementResource($placement),
            'Placement updated successfully.'
        );
    }

    public function destroy(Request $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->placementService->deletePlacement($placement);

            return $this->respondNoContent('Placement deleted successfully.');
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function submitToMarket(Request $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $placement = $this->placementService->submitToMarket($placement);

            return $this->respond(
                new PlacementResource($placement),
                'Placement submitted to market.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function bind(Request $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($placement->status !== PlacementStatus::Accepted->value &&
            $placement->status !== PlacementStatus::PartiallyAccepted->value) {
            return $this->respondError('Only accepted placements can be bound.', 422);
        }

        $placement->update(['status' => PlacementStatus::Bound->value]);

        $placement->load(['customer', 'policyProduct', 'markets.insuranceCompany']);

        return $this->respond(
            new PlacementResource($placement),
            'Placement bound successfully.'
        );
    }

    public function cancel(Request $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($placement->status === PlacementStatus::Cancelled->value) {
            return $this->respondError('Placement is already cancelled.', 422);
        }

        $placement->update(['status' => PlacementStatus::Cancelled->value]);

        return $this->respond(
            new PlacementResource($placement->load(['customer', 'policyProduct'])),
            'Placement cancelled.'
        );
    }

    public function convertToPolicy(Request $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $policy = $this->placementService->convertToPolicy($request->user(), $placement);

            return $this->respond(
                [
                    'policy_id' => $policy->id,
                    'policy_number' => $policy->policy_number,
                ],
                'Placement converted to policy successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    // ─── Markets ───

    public function indexMarkets(Request $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $markets = $placement->markets()->with('insuranceCompany')->get();

        return $this->respond(PlacementMarketResource::collection($markets));
    }

    public function storeMarket(StorePlacementMarketRequest $request, Placement $placement): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $market = $placement->markets()->create([
                'tenant_id' => $placement->tenant_id,
                ...$request->validated(),
                'status' => PlacementMarketStatus::Pending->value,
            ]);

            $market->load('insuranceCompany');

            return $this->respondCreated(
                new PlacementMarketResource($market),
                'Market added successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function showMarket(Request $request, Placement $placement, PlacementMarket $market): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($market->placement_id !== $placement->id) {
            return $this->respondNotFound();
        }

        $market->load('insuranceCompany');

        return $this->respond(new PlacementMarketResource($market));
    }

    public function updateMarket(UpdatePlacementMarketRequest $request, Placement $placement, PlacementMarket $market): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($market->placement_id !== $placement->id) {
            return $this->respondNotFound();
        }

        $market->update($request->validated());

        $market->load('insuranceCompany');

        return $this->respond(
            new PlacementMarketResource($market),
            'Market updated successfully.'
        );
    }

    public function destroyMarket(Request $request, Placement $placement, PlacementMarket $market): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($market->placement_id !== $placement->id) {
            return $this->respondNotFound();
        }

        $market->delete();

        return $this->respondNoContent('Market removed successfully.');
    }

    public function respondMarket(RespondMarketRequest $request, Placement $placement, PlacementMarket $market): JsonResponse
    {
        if ($placement->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($market->placement_id !== $placement->id) {
            return $this->respondNotFound();
        }

        $request->validated();

        $market->update([
            'status' => $request->status,
            'response_notes' => $request->response_notes,
            'insurer_reference' => $request->insurer_reference,
            'response_date' => now(),
        ]);

        $market->load('insuranceCompany');

        return $this->respond(
            new PlacementMarketResource($market),
            'Market response recorded successfully.'
        );
    }
}
