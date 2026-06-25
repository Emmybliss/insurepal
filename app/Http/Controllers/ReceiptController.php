<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Policy;
use App\Models\Receipt;
use App\Models\TenantDefaultTemplate;
use App\Services\DocumentGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    protected DocumentGenerationService $documentService;

    public function __construct(DocumentGenerationService $documentService)
    {
        $this->documentService = $documentService;
    }

    public function index()
    {
        $receipts = Receipt::with(['invoice', 'customer', 'policy', 'user'])
            ->where('tenant_id', Auth::user()->tenant_id)
            ->latest()
            ->paginate(10);

        return Inertia::render('Receipts/Index', [
            'receipts' => $receipts,
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'nullable|exists:invoices,id',
            'customer_id' => 'required|exists:customers,id',
            'policy_id' => 'nullable|exists:policies,id',
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'currency' => 'required|string|size:3',
        ]);

        try {
            DB::beginTransaction();

            $tenantId = Auth::user()->tenant_id;

            $receipt = Receipt::create([
                'receipt_number' => Receipt::generateReceiptNumber($tenantId),
                'tenant_id' => $tenantId,
                'user_id' => Auth::id(),
                'invoice_id' => $validated['invoice_id'] ?? null,
                'customer_id' => $validated['customer_id'],
                'policy_id' => $validated['policy_id'] ?? null,
                'amount_paid' => $validated['amount_paid'],
                'payment_method' => $validated['payment_method'],
                'payment_date' => $validated['payment_date'],
                'transaction_id' => $validated['transaction_id'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'currency' => $validated['currency'],
                'status' => Receipt::STATUS_COMPLETED,
            ]);

            // If linked to an invoice, update its payment status
            if ($receipt->invoice_id) {
                $invoice = Invoice::findOrFail($receipt->invoice_id);
                $totalPaid = $invoice->receipts()
                    ->where('status', Receipt::STATUS_COMPLETED)
                    ->sum('amount_paid');

                if ($totalPaid >= $invoice->total_amount) {
                    $invoice->update(['status' => 'paid']);
                } elseif ($totalPaid > 0) {
                    $invoice->update(['status' => 'partially_paid']);
                }
            }

            DB::commit();

            return redirect()->route('receipts.show', $receipt)
                ->with('success', 'Receipt created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
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

    public function update(Request $request, Receipt $receipt)
    {
        $validated = $request->validate([
            'invoice_id' => 'nullable|exists:invoices,id',
            'customer_id' => 'required|exists:customers,id',
            'policy_id' => 'nullable|exists:policies,id',
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'currency' => 'required|string|size:3',
        ]);

        try {
            DB::beginTransaction();

            $receipt->update([
                'invoice_id' => $validated['invoice_id'] ?? null,
                'customer_id' => $validated['customer_id'],
                'policy_id' => $validated['policy_id'] ?? null,
                'amount_paid' => $validated['amount_paid'],
                'payment_method' => $validated['payment_method'],
                'payment_date' => $validated['payment_date'],
                'transaction_id' => $validated['transaction_id'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'currency' => $validated['currency'],
            ]);

            // Re-sync invoice status if an invoice is linked
            $invoiceId = $validated['invoice_id'] ?? $receipt->invoice_id;
            if ($invoiceId) {
                $invoice = Invoice::findOrFail($invoiceId);
                $totalPaid = $invoice->receipts()
                    ->where('status', Receipt::STATUS_COMPLETED)
                    ->sum('amount_paid');

                if ($totalPaid >= $invoice->total_amount) {
                    $invoice->update(['status' => 'paid']);
                } elseif ($totalPaid > 0) {
                    $invoice->update(['status' => 'partially_paid']);
                } else {
                    $invoice->update(['status' => 'sent']);
                }
            }

            DB::commit();

            return redirect()->route('receipts.show', $receipt)
                ->with('success', 'Receipt updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'Failed to update receipt. '.$e->getMessage());
        }
    }

    public function destroy(Receipt $receipt)
    {
        if ($receipt->status !== Receipt::STATUS_PENDING) {
            return redirect()->back()
                ->with('error', 'Only pending receipts can be deleted.');
        }

        $receipt->delete();

        return redirect()->route('receipts.index')
            ->with('success', 'Receipt deleted successfully.');
    }

    public function markAsRefunded(Receipt $receipt)
    {
        if ($receipt->status !== Receipt::STATUS_COMPLETED) {
            return redirect()->back()
                ->with('error', 'Only completed payments can be refunded.');
        }

        try {
            DB::beginTransaction();

            $receipt->update(['status' => Receipt::STATUS_REFUNDED]);

            if ($receipt->invoice_id) {
                $invoice = $receipt->invoice;
                $totalPaid = $invoice->receipts()
                    ->where('status', Receipt::STATUS_COMPLETED)
                    ->sum('amount_paid');

                if ($totalPaid === 0) {
                    $invoice->update(['status' => 'sent']);
                } elseif ($totalPaid < $invoice->total_amount) {
                    $invoice->update(['status' => 'partially_paid']);
                }
            }

            DB::commit();

            return redirect()->back()
                ->with('success', 'Receipt marked as refunded.');

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->with('error', 'Failed to mark receipt as refunded. '.$e->getMessage());
        }
    }

    public function downloadPdf(Request $request, Receipt $receipt)
    {
        try {
            $receipt->load(['customer', 'invoice', 'tenant', 'policy']);

            $registry = config('document-templates.templates', []);
            $templateKey = $request->input('template_key', 'receipt.classic');
            $template = $registry[$templateKey] ?? null;

            $pdf = $this->documentService->generateReceiptPdf($receipt, $template);

            return response($pdf, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="receipt-'.$receipt->receipt_number.'.pdf"',
            ]);
        } catch (\Exception $e) {
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
        $request->validate([
            'template_key' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $registry = config('document-templates.templates', []);
            $templateKey = $request->input('template_key', 'receipt.classic');
            $template = $registry[$templateKey] ?? null;

            if (! $template) {
                throw new \Exception("Template '{$templateKey}' not found.");
            }

            // Generate PDF content
            $pdfContent = $this->documentService->generateReceiptPdf($receipt, $template);

            // Define storage path
            $fileName = 'receipt_'.$receipt->id.'_'.time().'.pdf';
            $filePath = 'receipts/'.$fileName;

            // Store file
            \Illuminate\Support\Facades\Storage::disk('public')->put($filePath, $pdfContent);

            // Update receipt
            $receipt->update([
                'file_path' => $filePath,
                'status' => Receipt::STATUS_COMPLETED,
            ]);

            DB::commit();

            return redirect()->route('receipts.show', $receipt->id)
                ->with('success', 'Receipt generated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Receipt generation failed: '.$e->getMessage());

            return redirect()->back()->with('error', 'Failed to generate receipt: '.$e->getMessage());
        }
    }

    public function previewReceipt(Receipt $receipt)
    {
        if (! $receipt->file_path || ! \Illuminate\Support\Facades\Storage::disk('public')->exists($receipt->file_path)) {
            return redirect()->back()->with('error', 'Receipt file not found.');
        }

        return response()->file(storage_path('app/public/'.$receipt->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="receipt-'.$receipt->receipt_number.'.pdf"',
        ]);
    }

    public function htmlPreview(Request $request, Receipt $receipt)
    {
        $registry = config('document-templates.templates', []);
        $templateKey = $request->input('template_key', 'receipt.classic');
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            $receiptTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'receipt');
            $templateKey = array_key_first($receiptTemplates);
            $template = $templateKey ? $registry[$templateKey] : null;
        }

        if (! $template) {
            return 'No receipt template found.';
        }

        $html = $this->documentService->generateReceiptHtml($receipt, $template, true);

        return response($html);
    }
}
