<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReceiptRequest;
use App\Http\Requests\UpdateReceiptRequest;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Policy;
use App\Models\Receipt;
use App\Models\TenantDefaultTemplate;
use App\Services\Finance\GenerateReceiptService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    protected GenerateReceiptService $receiptService;

    public function __construct(GenerateReceiptService $receiptService)
    {
        $this->receiptService = $receiptService;
    }

    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        $query = Receipt::with(['invoice', 'customer', 'policy', 'user'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "%{$search}%")
                    ->orWhere('amount_paid', 'like', "%{$search}%")
                    ->orWhere('payment_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('invoice', function ($iq) use ($search) {
                        $iq->where('invoice_number', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('payment_status', $request->input('status'));
        }

        $receipts = $query->latest()->paginate(10)->withQueryString();

        $totalReceipts = (float) Receipt::where('tenant_id', $tenantId)
            ->where('payment_status', Receipt::STATUS_COMPLETED)
            ->sum('amount_paid');

        $totalRefunded = (float) Receipt::where('tenant_id', $tenantId)
            ->where('payment_status', Receipt::STATUS_REFUNDED)
            ->sum('amount_paid');

        return Inertia::render('Receipts/Index', [
            'receipts' => $receipts,
            'stats' => [
                'total_receipts' => $totalReceipts,
                'total_refunded' => $totalRefunded,
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;

        $customers = Customer::where('tenant_id', $tenantId)->get();
        $policies = Policy::where('tenant_id', $tenantId)
            ->with(['policyProduct', 'policyType', 'policyClass'])
            ->get();

        // Auto-generate the next receipt number so the UI can display it
        $nextReceiptNumber = Receipt::generateReceiptNumber($tenantId);

        // Optionally pre-select an invoice if passed via query string (from invoice detail page)
        $invoice = null;
        if ($request->filled('invoice_id')) {
            $invoice = Invoice::with(['customer', 'policy', 'receipts'])
                ->find($request->invoice_id);
        }

        return Inertia::render('Receipts/Create', [
            'customers' => $customers,
            'policies' => $policies,
            'nextReceiptNumber' => $nextReceiptNumber,
            'invoice' => $invoice, // optional, may be null
        ]);
    }

    public function store(StoreReceiptRequest $request)
    {
        $validated = $request->validated();

        try {
            $receipt = $this->receiptService->generate(
                $validated,
                Auth::user()->tenant_id,
                Auth::id()
            );

            return redirect()->route('receipts.show', $receipt)
                ->with('success', 'Receipt created successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to create receipt: '.$e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
                'tenant_id' => Auth::user()?->tenant_id,
                'input' => $request->except(['_token']),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to create receipt. '.$e->getMessage());
        }
    }

    public function show(Receipt $receipt)
    {
        $receipt->load(['customer', 'invoice', 'tenant', 'policy', 'user']);

        $registry = config('document-templates.templates', []);
        $templates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'receipt');

        return Inertia::render('Receipts/Show', [
            'receipt' => $receipt,
            'templates' => $templates,
        ]);
    }

    public function edit(Receipt $receipt)
    {
        $receipt->load(['invoice', 'customer', 'policy', 'user']);

        $tenantId = Auth::user()->tenant_id;
        $customers = Customer::where('tenant_id', $tenantId)->get();
        $policies = Policy::where('tenant_id', $tenantId)
            ->with(['policyProduct', 'policyType', 'policyClass'])
            ->get();

        // Load invoice relations only if invoice exists
        if ($receipt->invoice) {
            $receipt->invoice->load(['customer', 'policy', 'receipts']);
        }

        return Inertia::render('Receipts/Edit', [
            'receipt' => $receipt,
            'invoice' => $receipt->invoice, // may be null
            'customers' => $customers,
            'policies' => $policies,
        ]);
    }

    public function update(UpdateReceiptRequest $request, Receipt $receipt)
    {
        $validated = $request->validated();

        try {
            $receipt = $this->receiptService->update($receipt, $validated);

            return redirect()->route('receipts.show', $receipt)
                ->with('success', 'Receipt updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update receipt: '.$e->getMessage(), [
                'exception' => $e,
                'receipt_id' => $receipt->id,
                'user_id' => Auth::id(),
                'tenant_id' => Auth::user()?->tenant_id,
                'input' => $request->except(['_token']),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update receipt. '.$e->getMessage());
        }
    }

    public function destroy(Receipt $receipt)
    {
        if ($receipt->payment_status !== Receipt::STATUS_PENDING) {
            return redirect()->back()
                ->with('error', 'Only pending receipts can be deleted.');
        }

        $receipt->delete();

        return redirect()->route('receipts.index')
            ->with('success', 'Receipt deleted successfully.');
    }

    public function markAsRefunded(Receipt $receipt)
    {
        if ($receipt->payment_status !== Receipt::STATUS_COMPLETED) {
            return redirect()->back()
                ->with('error', 'Only completed payments can be refunded.');
        }

        try {
            $this->receiptService->markAsRefunded($receipt);

            return redirect()->back()
                ->with('success', 'Receipt marked as refunded.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to mark receipt as refunded. '.$e->getMessage());
        }
    }

    public function downloadPdf(Request $request, Receipt $receipt)
    {
        @set_time_limit(120);

        try {
            $receipt->load(['customer', 'invoice', 'tenant', 'policy']);

            $templateKey = $request->input('template_key', 'receipt.classic');

            $pdf = $this->receiptService->generatePdf($receipt, $templateKey);

            return response($pdf, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="receipt-'.$receipt->receipt_number.'.pdf"',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate PDF for receipt: '.$e->getMessage(), [
                'receipt_id' => $receipt->id,
                'exception' => $e,
            ]);

            if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
                return response()->json(['message' => 'Failed to generate PDF: '.$e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Failed to generate PDF: '.$e->getMessage());
        }
    }

    public function getReceiptGenerationOptions(Request $request, Receipt $receipt)
    {
        $registry = config('document-templates.templates', []);
        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($receipt->tenant_id, 'receipt')
            ?? 'receipt.classic';
        $defaultTemplate = $registry[$defaultTemplateKey] ?? null;

        return Inertia::render('Receipts/GenerateReceipt', [
            'receipt' => $receipt->load(['customer', 'policy', 'invoice', 'tenant']),
            'defaultTemplateKey' => $defaultTemplateKey,
            'defaultTemplate' => $defaultTemplate,
        ]);
    }

    public function generateReceipt(Request $request, Receipt $receipt)
    {
        @set_time_limit(120);

        $request->validate([
            'template_key' => 'required|string',
        ]); // single field — leave inline

        try {
            $registry = config('document-templates.templates', []);
            $templateKey = $request->input('template_key', 'receipt.classic');

            if (! isset($registry[$templateKey])) {
                return redirect()->back()->with('error', "Template '{$templateKey}' not found.");
            }

            $pdfContent = $this->receiptService->generatePdf($receipt, $templateKey);
            $this->receiptService->storePdf($receipt, $pdfContent);

            return redirect()->route('receipts.show', $receipt->id)
                ->with('success', 'Receipt generated successfully.');
        } catch (\Exception $e) {
            Log::error('Receipt generation failed: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to generate receipt: '.$e->getMessage());
        }
    }

    public function previewReceipt(Receipt $receipt)
    {
        @set_time_limit(120);

        if (! $receipt->file_path || ! Storage::disk('public')->exists($receipt->file_path)) {
            return redirect()->back()->with('error', 'Receipt file not found.');
        }

        return response()->file(storage_path('app/public/'.$receipt->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="receipt-'.$receipt->receipt_number.'.pdf"',
        ]);
    }

    public function htmlPreview(Request $request, Receipt $receipt)
    {
        @set_time_limit(120);

        try {
            $templateKey = $request->input('template_key', 'receipt.classic');
            $pdfContent = app(\App\Services\DocumentGenerationService::class)->generateReceiptPdf($receipt, $templateKey);

            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="receipt-preview.pdf"',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to render htmlPreview for receipt: '.$e->getMessage());

            return response('Failed to generate PDF preview: '.$e->getMessage(), 500);
        }
    }
}
