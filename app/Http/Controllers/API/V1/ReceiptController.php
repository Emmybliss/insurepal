<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreReceiptRequest;
use App\Http\Requests\Api\V1\UpdateReceiptRequest;
use App\Http\Resources\Api\V1\ReceiptAllocationResource;
use App\Http\Resources\Api\V1\ReceiptCollection;
use App\Http\Resources\Api\V1\ReceiptResource;
use App\Http\Responses\ApiResponse;
use App\Models\Receipt;
use App\Services\Finance\GenerateReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected GenerateReceiptService $receiptService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = Receipt::forTenant($tenantId)
            ->with(['invoice', 'customer', 'policy']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($paymentStatus = $request->payment_status) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($paymentMethod = $request->payment_method) {
            $query->where('payment_method', $paymentMethod);
        }

        if ($customerId = $request->customer_id) {
            $query->where('customer_id', $customerId);
        }

        if ($invoiceId = $request->invoice_id) {
            $query->where('invoice_id', $invoiceId);
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('payment_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->date_to) {
            $query->whereDate('payment_date', '<=', $dateTo);
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'receipt_number', 'amount_paid', 'payment_date', 'payment_status', 'created_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $receipts = $query->paginate($perPage);

        return ReceiptCollection::make($receipts)->response();
    }

    public function store(StoreReceiptRequest $request): JsonResponse
    {
        $user = $request->user();

        try {
            $receipt = $this->receiptService->generate(
                $request->validated(),
                $user->tenant_id,
                $user->id
            );

            $receipt->load(['invoice', 'customer', 'policy']);

            return $this->respondCreated(
                new ReceiptResource($receipt),
                'Receipt created successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to create receipt: '.$e->getMessage(), 422);
        }
    }

    public function show(Request $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $receipt->load(['invoice', 'customer', 'policy', 'user', 'receiptAllocations']);

        return $this->respond(new ReceiptResource($receipt));
    }

    public function update(UpdateReceiptRequest $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($receipt->payment_status === Receipt::STATUS_COMPLETED) {
            return $this->respondError('Completed receipts cannot be edited.', 422);
        }

        try {
            $receipt = $this->receiptService->update($receipt, $request->validated());

            $receipt->load(['invoice', 'customer', 'policy']);

            return $this->respond(
                new ReceiptResource($receipt),
                'Receipt updated successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to update receipt: '.$e->getMessage(), 422);
        }
    }

    public function destroy(Request $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! in_array($receipt->payment_status, [Receipt::STATUS_PENDING])) {
            return $this->respondError('Only pending receipts can be deleted.', 422);
        }

        $receipt->delete();

        return $this->respondNoContent('Receipt deleted successfully.');
    }

    // ─── Workflow ───

    public function markAsCompleted(Request $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($receipt->payment_status !== Receipt::STATUS_PENDING) {
            return $this->respondError('Only pending receipts can be marked as completed.', 422);
        }

        try {
            $receipt = $this->receiptService->markAsCompleted($receipt);

            $receipt->load(['invoice', 'customer', 'policy']);

            return $this->respond(
                new ReceiptResource($receipt),
                'Receipt marked as completed.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to mark receipt as completed: '.$e->getMessage(), 422);
        }
    }

    public function markAsRefunded(Request $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($receipt->payment_status !== Receipt::STATUS_COMPLETED) {
            return $this->respondError('Only completed receipts can be refunded.', 422);
        }

        try {
            $receipt = $this->receiptService->markAsRefunded($receipt);

            $receipt->load(['invoice', 'customer', 'policy']);

            return $this->respond(
                new ReceiptResource($receipt),
                'Receipt marked as refunded.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to mark receipt as refunded: '.$e->getMessage(), 422);
        }
    }

    public function void(Request $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (in_array($receipt->payment_status, [Receipt::STATUS_REFUNDED, Receipt::STATUS_VOIDED])) {
            return $this->respondError('Receipt cannot be voided in its current status.', 422);
        }

        $receipt = $this->receiptService->void($receipt, $request->input('reason'));

        $receipt->load(['invoice', 'customer', 'policy']);

        return $this->respond(
            new ReceiptResource($receipt),
            'Receipt voided successfully.'
        );
    }

    // ─── Allocations ───

    public function indexAllocations(Request $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        return $this->respond(
            ReceiptAllocationResource::collection($receipt->receiptAllocations)
        );
    }
}
