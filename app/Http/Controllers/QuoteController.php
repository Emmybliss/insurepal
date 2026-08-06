<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuotePremiumCalculationRequest;
use App\Http\Requests\QuoteRequest;
use App\Http\Requests\Shared\NotesActionRequest;
use App\Http\Requests\StoreQuoteRequest;
use App\Http\Requests\UpdateQuoteRequest;
use App\Models\ClauseLibrary;
use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\Quote;
use App\Services\QuoteCalculationService;
use App\Services\QuotePdfService;
use App\Services\QuoteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class QuoteController extends Controller
{
    public function __construct(
        protected QuoteService $quoteService,
        protected QuoteCalculationService $calculationService,
        protected QuotePdfService $pdfService,
    ) {
        $this->middleware('tenant.type:broker,underwriter,customer')->except(['verify']);
    }

    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'status', 'customer_id', 'product_id',
            'date_from', 'date_to', 'valid_until', 'created_by',
        ]);

        $user = $request->user();

        return Inertia::render('quotes/index', [
            'quotes' => $this->quoteService->getQuotesForTenant($user, $filters, $request->integer('per_page', 15)),
            'customers' => Customer::forTenant($user->tenant_id)
                ->select('id', 'type', 'first_name', 'last_name', 'company_name')
                ->orderBy('first_name')
                ->orderBy('company_name')
                ->get(),
            'products' => InsuranceProduct::active()
                ->select('id', 'name', 'type')
                ->orderBy('name')
                ->get(),
            'statistics' => $this->quoteService->getQuoteStatistics($user->tenant_id),
            'filters' => $filters,
            'statuses' => Quote::getStatuses(),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();

        $selectedCustomer = null;
        if ($request->filled('customer_id')) {
            $selectedCustomer = Customer::forTenant($user->tenant_id)->find($request->customer_id);
        }

        return Inertia::render('quotes/create', [
            'customers' => Customer::forTenant($user->tenant_id)
                ->active()
                ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email')
                ->get(),
            'policyTypes' => PolicyType::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'policyClasses' => PolicyClass::select('id', 'name', 'risk_mode', 'policy_type_id')->get(),
            'policyProducts' => PolicyProduct::forTenant($user->tenant_id)
                ->where('is_active', true)
                ->with('policyClass:id,name')
                ->get(),
            'products' => InsuranceProduct::active()
                ->select('id', 'name', 'type', 'description', 'form_fields', 'base_premium')
                ->orderBy('name')
                ->get(),
            'clauseLibrary' => ClauseLibrary::active()
                ->where(function ($q) use ($user) {
                    $q->whereNull('tenant_id')
                        ->orWhere('tenant_id', $user->tenant_id);
                })
                ->orderBy('sort_order')
                ->get(),
            'selectedCustomer' => $selectedCustomer,
            'defaultValidUntil' => now()->addDays(30)->toDateString(),
            'documentTemplates' => collect(config('document-templates.templates', []))->map(fn ($t, $k) => [
                'key' => $k,
                'name' => $t['name'] ?? $k,
                'type' => $t['type'] ?? '',
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if ($request instanceof StoreQuoteRequest) {
            $validated = $request->validated();
        } elseif ($request instanceof QuoteRequest) {
            $validated = $request->validatedData();
        } else {
            $storeReq = app(StoreQuoteRequest::class);
            $validated = $storeReq->validated();
        }

        $quote = $this->quoteService->createQuote($validated, $request->user());

        return to_route('quotes.show', $quote)->with('success', 'Quote created successfully.');
    }

    public function show(Quote $quote): Response
    {
        $quote->load([
            'customer',
            'insuranceProduct',
            'policyClass',
            'policyType',
            'items' => fn ($q) => $q->orderBy('sort_order'),
            'clauses' => fn ($q) => $q->orderBy('sort_order'),
            'versions' => fn ($q) => $q->latest(),
            'emailLogs' => fn ($q) => $q->latest(),
            'approvals' => fn ($q) => $q->latest(),
            'createdBy',
            'issuedBy',
            'approvedBy',
            'reviewedBy',
            'signedBy',
            'policy',
        ]);

        return Inertia::render('quotes/show', [
            'quote' => $quote,
            'canEdit' => $quote->canEdit(),
            'canSend' => $quote->canSend(),
            'canAccept' => $quote->canAccept(),
            'canReject' => $quote->canReject(),
            'canConvertToPolicy' => $quote->canConvertToPolicy(),
        ]);
    }

    public function edit(Quote $quote): Response
    {
        $quote->load([
            'customer',
            'insuranceProduct',
            'policyClass',
            'items' => fn ($q) => $q->orderBy('sort_order'),
            'clauses' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        $user = request()->user();

        return Inertia::render('quotes/edit', [
            'quote' => $quote,
            'customers' => Customer::forTenant($user->tenant_id)
                ->active()
                ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email')
                ->get(),
            'policyTypes' => PolicyType::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'policyClasses' => PolicyClass::select('id', 'name', 'risk_mode', 'policy_type_id')->get(),
            'policyProducts' => PolicyProduct::forTenant($user->tenant_id)
                ->where('is_active', true)
                ->with('policyClass:id,name')
                ->get(),
            'products' => InsuranceProduct::active()
                ->select('id', 'name', 'type', 'description', 'form_fields', 'base_premium')
                ->orderBy('name')
                ->get(),
            'clauseLibrary' => ClauseLibrary::active()
                ->where(function ($q) use ($user) {
                    $q->whereNull('tenant_id')
                        ->orWhere('tenant_id', $user->tenant_id);
                })
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function update(Request $request, Quote $quote): RedirectResponse
    {
        if ($request instanceof UpdateQuoteRequest) {
            $validated = $request->validated();
        } elseif ($request instanceof QuoteRequest) {
            $validated = $request->validatedData();
        } else {
            $updReq = app(UpdateQuoteRequest::class);
            $validated = $updReq->validated();
        }

        $updatedQuote = $this->quoteService->updateQuote($quote, $validated);

        return to_route('quotes.show', $updatedQuote)->with('success', 'Quote updated successfully.');
    }

    public function destroy(Quote $quote): RedirectResponse
    {
        $this->quoteService->deleteQuote($quote);

        return to_route('quotes.index')->with('success', 'Quote deleted successfully.');
    }

    public function submitForReview(Request $request, Quote $quote): RedirectResponse
    {
        $validated = $request->validate(['notes' => ['nullable', 'string']]);

        $this->quoteService->submitForReview($quote, $request->user(), $validated['notes'] ?? null);

        return to_route('quotes.show', $quote)->with('success', 'Quote submitted for review.');
    }

    public function approve(NotesActionRequest $request, Quote $quote): RedirectResponse
    {
        $approval = $quote->approvals()->latest()->firstOrFail();
        $approval->approve($request->validated('notes'));

        return to_route('quotes.show', $quote)->with('success', 'Quote approved.');
    }

    public function requestChanges(Request $request, Quote $quote): RedirectResponse
    {
        $validated = $request->validate(['changes' => ['required', 'string']]);

        $approval = $quote->approvals()->latest()->firstOrFail();
        $approval->requestChanges($validated['changes']);

        return to_route('quotes.show', $quote)->with('info', 'Changes requested for quote.');
    }

    public function send(Request $request, Quote $quote): RedirectResponse
    {
        $this->quoteService->sendQuote($quote, $request->user());

        return back()->with('success', 'Quote sent to customer successfully.');
    }

    public function accept(Request $request, Quote $quote): RedirectResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $this->quoteService->acceptQuote($quote, $request->reason);

        return back()->with('success', 'Quote accepted successfully.');
    }

    public function reject(Request $request, Quote $quote): RedirectResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $this->quoteService->rejectQuote($quote, $request->reason);

        return back()->with('success', 'Quote rejected successfully.');
    }

    public function issue(Request $request, Quote $quote): RedirectResponse
    {
        $issuedQuote = $this->quoteService->issueQuote($quote, $request->user());
        $this->pdfService->savePdf($issuedQuote);

        return to_route('quotes.show', $quote)->with('success', 'Quote issued successfully.');
    }

    public function withdraw(Quote $quote): RedirectResponse
    {
        $this->quoteService->withdrawQuote($quote);

        return to_route('quotes.show', $quote)->with('info', 'Quote withdrawn.');
    }

    public function createNewVersion(Quote $quote): RedirectResponse
    {
        $newQuote = $this->quoteService->createNewVersion($quote);

        return to_route('quotes.edit', $newQuote)->with('success', 'New version of quote created.');
    }

    public function convertToPolicy(Quote $quote): RedirectResponse
    {
        $policy = $this->quoteService->convertToPolicy($quote, request()->user());

        return redirect()->route('policies.show', $policy)->with('success', 'Quote converted to policy successfully.');
    }

    public function duplicate(Quote $quote): RedirectResponse
    {
        $newQuote = $this->quoteService->duplicateQuote($quote);

        return redirect()->route('quotes.edit', $newQuote)->with('success', 'Quote duplicated successfully.');
    }

    public function extendValidity(Request $request, Quote $quote): RedirectResponse
    {
        $request->validate(['days' => 'required|integer|min:1|max:365']);

        $this->quoteService->extendQuoteValidity($quote, $request->integer('days'));

        return back()->with('success', "Quote validity extended by {$request->days} days.");
    }

    public function download(Quote $quote): \Symfony\Component\HttpFoundation\Response
    {
        $path = $this->pdfService->savePdf($quote);

        $fullPath = Storage::disk('public')->path($path);
        if (! file_exists($fullPath)) {
            abort(404);
        }

        $content = file_get_contents($fullPath);
        $fileName = "quote-{$quote->quote_number}-v{$quote->version}.pdf";

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            'Content-Length' => strlen($content),
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    public function preview(Quote $quote): \Illuminate\Http\Response
    {
        $pdfContent = $this->pdfService->generatePdf($quote, preview: false);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="quote-preview.pdf"',
        ]);
    }

    public function htmlPreview(Request $request, Quote $quote): \Illuminate\Http\Response
    {
        $pdfContent = $this->pdfService->generatePdf($quote, preview: true);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="quote-preview.pdf"',
        ]);
    }

    public function calculatePremiums(QuotePremiumCalculationRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        $grossPremium = $this->calculationService->calculateGrossPremium(
            $validated['sum_insured'],
            $validated['rate'] ?? null,
            $validated['rate_basis'] ?? null,
        );

        $commissionAmount = $this->calculationService->calculateCommission(
            $grossPremium,
            $validated['commission_rate'] ?? null,
        );

        $netPremium = $this->calculationService->calculateNetPremium(
            $grossPremium,
            $commissionAmount,
            $validated['fees'] ?? null,
            $validated['taxes'] ?? null,
            $validated['discount'] ?? null,
        );

        return response()->json([
            'gross_premium' => $grossPremium,
            'commission_amount' => $commissionAmount,
            'net_premium' => $netPremium,
        ]);
    }

    public function verify(Quote $quote): Response
    {
        $quote->load([
            'customer',
            'policyClass',
            'items',
            'clauses',
            'versions' => fn ($q) => $q->latest()->limit(5),
        ]);

        $checksumValid = null;
        $isBackfilled = false;

        if ($quote->snapshot_json && $quote->checksum) {
            $checksumValid = hash('sha256', json_encode($quote->snapshot_json)) === $quote->checksum;
        } elseif (! $quote->checksum) {
            $snapshot = $this->quoteService->buildSnapshotForVerification($quote);
            $checksum = hash('sha256', json_encode($snapshot));

            $quote->updateQuietly([
                'snapshot_json' => $snapshot,
                'checksum' => $checksum,
            ]);

            $checksumValid = true;
            $isBackfilled = true;
        }

        return Inertia::render('quotes/verify', [
            'quote' => $quote,
            'checksumValid' => $checksumValid,
            'isBackfilled' => $isBackfilled,
        ]);
    }

    public function expiringSoon()
    {
        $expiringQuotes = $this->quoteService->getExpiringQuotes(request()->user(), 7);

        return response()->json([
            'quotes' => $expiringQuotes,
            'count' => $expiringQuotes->count(),
        ]);
    }

    public function exportPdf(Request $request)
    {
        return back()->with('info', 'PDF export functionality is available per quote.');
    }
}
