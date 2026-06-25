<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuoteRequest;
use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Quote;
use App\Services\QuoteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QuoteController extends Controller
{
    public function __construct(
        private QuoteService $quoteService
    ) {
        $this->authorizeResource(Quote::class, 'quote');
    }

    /**
     * Display a listing of quotes.
     */
    public function index(Request $request)
    {
        $filters = $request->only([
            'search', 'status', 'customer_id', 'product_id',
            'date_from', 'date_to', 'valid_until', 'created_by',
        ]);

        $quotes = $this->quoteService->getQuotesForTenant($filters, $request->get('per_page', 15));

        // Get filter options
        $customers = Customer::forTenant(Auth::user()->tenant_id)
            ->select('id', 'type', 'first_name', 'last_name', 'company_name')
            ->orderBy('first_name')
            ->orderBy('company_name')
            ->get();

        $products = InsuranceProduct::active()
            ->select('id', 'name', 'type')
            ->orderBy('name')
            ->get();

        $statistics = $this->quoteService->getQuoteStatistics(Auth::user()->tenant_id);

        return Inertia::render('quotes/index', [
            'quotes' => $quotes,
            'customers' => $customers,
            'products' => $products,
            'statistics' => $statistics,
            'filters' => $filters,
            'statuses' => Quote::getStatuses(),
        ]);
    }

    /**
     * Show the form for creating a new quote.
     */
    public function create(Request $request)
    {
        $customers = Customer::forTenant(Auth::user()->tenant_id)
            ->active()
            ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email', 'type')
            ->selectRaw("COALESCE(company_name, CONCAT(first_name, ' ', last_name)) as display_name")
            ->orderBy('display_name')
            ->get();

        $products = InsuranceProduct::active()
            ->select('id', 'name', 'type', 'description', 'form_fields', 'base_premium')
            ->orderBy('name')
            ->get();

        $selectedCustomer = null;
        if ($request->filled('customer_id')) {
            $selectedCustomer = Customer::forTenant(Auth::user()->tenant_id)
                ->find($request->customer_id);
        }

        return Inertia::render('quotes/create', [
            'customers' => $customers,
            'products' => $products,
            'selectedCustomer' => $selectedCustomer,
            'defaultValidUntil' => now()->addDays(30)->toDateString(),
        ]);
    }

    /**
     * Store a newly created quote.
     */
    public function store(QuoteRequest $request)
    {
        try {
            $quote = $this->quoteService->createQuote($request->validatedData());

            return redirect()->route('quotes.show', $quote)
                ->with('success', 'Quote created successfully.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Failed to create quote: '.$e->getMessage());
        }
    }

    /**
     * Display the specified quote.
     */
    public function show(Quote $quote)
    {
        $quote->load([
            'customer:id,type,first_name,last_name,company_name,email,phone,address',
            'insuranceProduct:id,name,type,description',
            'createdBy:id,name',
            'policy:id,policy_number,status',
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

    /**
     * Show the form for editing the specified quote.
     */
    public function edit(Quote $quote)
    {
        if (! $quote->canEdit()) {
            return redirect()->route('quotes.show', $quote)
                ->with('error', 'This quote cannot be edited in its current status.');
        }

        $quote->load(['customer', 'insuranceProduct']);

        $customers = Customer::forTenant(Auth::user()->tenant_id)
            ->active()
            ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email')
            ->orderBy('first_name')
            ->orderBy('company_name')
            ->get();

        $products = InsuranceProduct::active()
            ->select('id', 'name', 'type', 'description', 'form_fields', 'base_premium')
            ->orderBy('name')
            ->get();

        return Inertia::render('quotes/edit', [
            'quote' => $quote,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified quote.
     */
    public function update(QuoteRequest $request, Quote $quote)
    {
        try {
            $updatedQuote = $this->quoteService->updateQuote($quote, $request->validatedData());

            return redirect()->route('quotes.show', $updatedQuote)
                ->with('success', 'Quote updated successfully.');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Failed to update quote: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified quote.
     */
    public function destroy(Quote $quote)
    {
        try {
            $this->quoteService->deleteQuote($quote);

            return redirect()->route('quotes.index')
                ->with('success', 'Quote deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete quote: '.$e->getMessage());
        }
    }

    /**
     * Send quote to customer.
     */
    public function send(Quote $quote)
    {
        $this->authorize('update', $quote);

        try {
            $this->quoteService->sendQuote($quote);

            return back()->with('success', 'Quote sent to customer successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to send quote: '.$e->getMessage());
        }
    }

    /**
     * Accept a quote.
     */
    public function accept(Request $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $this->quoteService->acceptQuote($quote, $request->reason);

            return back()->with('success', 'Quote accepted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to accept quote: '.$e->getMessage());
        }
    }

    /**
     * Reject a quote.
     */
    public function reject(Request $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $this->quoteService->rejectQuote($quote, $request->reason);

            return back()->with('success', 'Quote rejected successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to reject quote: '.$e->getMessage());
        }
    }

    /**
     * Convert quote to policy.
     */
    public function convertToPolicy(Quote $quote)
    {
        $this->authorize('update', $quote);

        try {
            $policy = $this->quoteService->convertToPolicy($quote);

            return redirect()->route('policies.show', $policy)
                ->with('success', 'Quote converted to policy successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to convert quote to policy: '.$e->getMessage());
        }
    }

    /**
     * Duplicate a quote.
     */
    public function duplicate(Quote $quote)
    {
        $this->authorize('create', Quote::class);

        try {
            $newQuote = $this->quoteService->duplicateQuote($quote);

            return redirect()->route('quotes.edit', $newQuote)
                ->with('success', 'Quote duplicated successfully. You can now make changes to the new quote.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to duplicate quote: '.$e->getMessage());
        }
    }

    /**
     * Extend quote validity.
     */
    public function extendValidity(Request $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $request->validate([
            'days' => 'required|integer|min:1|max:365',
        ]);

        try {
            $this->quoteService->extendQuoteValidity($quote, $request->days);

            return back()->with('success', "Quote validity extended by {$request->days} days.");
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to extend quote validity: '.$e->getMessage());
        }
    }

    /**
     * Export quotes to PDF.
     */
    public function exportPdf(Request $request)
    {
        // Implementation for PDF export would go here
        // This is a placeholder for the export functionality
        return back()->with('info', 'PDF export functionality will be implemented.');
    }

    /**
     * Get quotes expiring soon (for notifications/alerts).
     */
    public function expiringSoon()
    {
        $expiringQuotes = $this->quoteService->getExpiringQuotes(7);

        return response()->json([
            'quotes' => $expiringQuotes,
            'count' => $expiringQuotes->count(),
        ]);
    }
}
