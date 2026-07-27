<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreQuoteRequest;
use App\Http\Requests\Api\V1\UpdateQuoteRequest;
use App\Http\Resources\Api\V1\QuoteCollection;
use App\Http\Resources\Api\V1\QuoteResource;
use App\Http\Responses\ApiResponse;
use App\Models\Quote;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    use ApiResponse;

    public function __construct(
        private QuoteService $quoteService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search', 'status', 'customer_id', 'product_id',
            'date_from', 'date_to', 'valid_until', 'created_by',
        ]);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $quotes = $this->quoteService->getQuotesForTenant($request->user(), $filters, $perPage);

        return QuoteCollection::make($quotes)->response();
    }

    public function store(StoreQuoteRequest $request): JsonResponse
    {
        $quote = $this->quoteService->createQuote($request->validated(), $request->user());

        return $this->respondCreated(
            new QuoteResource($quote),
            'Quote created successfully.'
        );
    }

    public function show(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $quote->load([
            'customer',
            'insuranceProduct',
            'createdBy',
            'policy',
        ]);

        return $this->respond(new QuoteResource($quote));
    }

    public function update(UpdateQuoteRequest $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $quote = $this->quoteService->updateQuote($quote, $request->validated());

        return $this->respond(
            new QuoteResource($quote),
            'Quote updated successfully.'
        );
    }

    public function destroy(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->quoteService->deleteQuote($quote);

            return $this->respondNoContent('Quote deleted successfully.');
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function send(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $this->quoteService->sendQuote($quote);

            return $this->respond(
                new QuoteResource($quote->fresh()->load(['customer', 'insuranceProduct', 'createdBy'])),
                'Quote sent to customer successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function accept(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['reason' => 'nullable|string|max:500']); // single field — leave inline

        try {
            $quote = $this->quoteService->acceptQuote($quote, $request->reason);

            return $this->respond(
                new QuoteResource($quote->load(['customer', 'insuranceProduct', 'createdBy'])),
                'Quote accepted successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function reject(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['reason' => 'required|string|max:500']); // single field — leave inline

        try {
            $quote = $this->quoteService->rejectQuote($quote, $request->reason);

            return $this->respond(
                new QuoteResource($quote->load(['customer', 'insuranceProduct', 'createdBy'])),
                'Quote rejected successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function convertToPolicy(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $policy = $this->quoteService->convertToPolicy($quote, $request->user());

            return $this->respond(
                $policy->load(['customer', 'insuranceProduct', 'quote']),
                'Quote converted to policy successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function duplicate(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        try {
            $newQuote = $this->quoteService->duplicateQuote($quote);

            return $this->respond(
                new QuoteResource($newQuote),
                'Quote duplicated successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function extendValidity(Request $request, Quote $quote): JsonResponse
    {
        if ($quote->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $request->validate(['days' => 'required|integer|min:1|max:365']); // single field — leave inline

        try {
            $this->quoteService->extendQuoteValidity($quote, (int) $request->days);

            return $this->respond(
                new QuoteResource($quote->fresh()->load(['customer', 'insuranceProduct', 'createdBy'])),
                "Quote validity extended by {$request->days} days."
            );
        } catch (\Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }
}
