<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreInvoiceRequest;
use App\Http\Requests\Api\V1\UpdateInvoiceRequest;
use App\Http\Resources\Api\V1\InvoiceCollection;
use App\Http\Resources\Api\V1\InvoiceResource;
use App\Http\Responses\ApiResponse;
use App\Models\Invoice;
use App\Services\Finance\GenerateInvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    use ApiResponse;

    public function __construct(
        private GenerateInvoiceService $generateInvoiceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = Invoice::forTenant($tenantId)
            ->with(['customer', 'policy', 'items']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
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

        if ($paymentStatus = $request->payment_status) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($customerId = $request->customer_id) {
            $query->where('customer_id', $customerId);
        }

        if ($policyId = $request->policy_id) {
            $query->where('policy_id', $policyId);
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->date_to) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($dueDateFrom = $request->due_date_from) {
            $query->whereDate('due_date', '>=', $dueDateFrom);
        }

        if ($dueDateTo = $request->due_date_to) {
            $query->whereDate('due_date', '<=', $dueDateTo);
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'invoice_number', 'status', 'total_amount', 'due_date', 'created_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $invoices = $query->paginate($perPage);

        return InvoiceCollection::make($invoices)->response();
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        try {
            $invoice = $this->generateInvoiceService->generate(
                $request->validated(),
                $request->user(),
            );

            $invoice->load(['customer', 'policy', 'items']);

            return $this->respondCreated(
                new InvoiceResource($invoice),
                'Invoice created successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to create invoice: '.$e->getMessage(), 422);
        }
    }

    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $invoice->load(['customer', 'policy', 'items', 'user', 'tenant']);

        return $this->respond(new InvoiceResource($invoice));
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return $this->respondError('Only draft invoices can be edited.', 422);
        }

        try {
            $this->generateInvoiceService->updateInvoice(
                $invoice,
                $request->validated(),
            );

            $invoice->load(['customer', 'policy', 'items']);

            return $this->respond(
                new InvoiceResource($invoice),
                'Invoice updated successfully.'
            );
        } catch (\Exception $e) {
            return $this->respondError('Failed to update invoice: '.$e->getMessage(), 422);
        }
    }

    public function destroy(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return $this->respondError('Only draft invoices can be deleted.', 422);
        }

        $invoice->delete();

        return $this->respondNoContent('Invoice deleted successfully.');
    }

    // ─── Items ───

    public function indexItems(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        return $this->respond(
            \App\Http\Resources\Api\V1\InvoiceItemResource::collection($invoice->items)
        );
    }

    // ─── Workflow ───

    public function markAsSent(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return $this->respondError('Only draft invoices can be marked as sent.', 422);
        }

        $invoice->update(['status' => Invoice::STATUS_SENT]);

        return $this->respond(
            new InvoiceResource($invoice->load(['customer', 'policy', 'items'])),
            'Invoice marked as sent.'
        );
    }

    public function markAsPaid(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! in_array($invoice->status, [Invoice::STATUS_SENT])) {
            return $this->respondError('Only sent invoices can be marked as paid.', 422);
        }

        $invoice->update(['status' => Invoice::STATUS_PAID]);

        return $this->respond(
            new InvoiceResource($invoice->load(['customer', 'policy', 'items'])),
            'Invoice marked as paid.'
        );
    }

    public function void(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (in_array($invoice->status, [Invoice::STATUS_VOID, Invoice::STATUS_CANCELLED, Invoice::STATUS_PAID])) {
            return $this->respondError('Invoice cannot be voided in its current status.', 422);
        }

        $reason = $request->input('reason');
        $invoice->update([
            'status' => Invoice::STATUS_VOID,
            'notes' => $reason ? trim($invoice->notes."\n".$reason) : $invoice->notes,
        ]);

        return $this->respond(
            new InvoiceResource($invoice->load(['customer', 'policy', 'items'])),
            'Invoice voided successfully.'
        );
    }

    public function cancel(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (in_array($invoice->status, [Invoice::STATUS_VOID, Invoice::STATUS_CANCELLED, Invoice::STATUS_PAID])) {
            return $this->respondError('Invoice cannot be cancelled in its current status.', 422);
        }

        $reason = $request->input('reason');
        $invoice->update([
            'status' => Invoice::STATUS_CANCELLED,
            'notes' => $reason ? trim($invoice->notes."\n".$reason) : $invoice->notes,
        ]);

        return $this->respond(
            new InvoiceResource($invoice->load(['customer', 'policy', 'items'])),
            'Invoice cancelled successfully.'
        );
    }
}
