<?php

namespace App\Http\Controllers;

use App\Models\BrokerSlip;
use App\Models\ClauseLibrary;
use App\Models\Customer;
use App\Models\InsuranceCompany;
use App\Models\Placement;
use App\Models\PolicyProduct;
use App\Services\BrokerSlipCalculationService;
use App\Services\BrokerSlipPdfService;
use App\Services\BrokerSlipService;
use App\Services\Documents\FinancialNotePayloadMapper;
use App\Services\Documents\HtmlTemplatePdfGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrokerSlipController extends Controller
{
    public function __construct(
        protected BrokerSlipService $brokerSlipService,
        protected BrokerSlipCalculationService $calculationService,
        protected BrokerSlipPdfService $pdfService,
        protected FinancialNotePayloadMapper $payloadMapper,
        protected HtmlTemplatePdfGenerator $pdfGenerator,
    ) {
        $this->middleware('tenant.type:broker');
    }

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status']);

        return Inertia::render('broker-slips/Index', [
            'brokerSlips' => $this->brokerSlipService->getSlipsForTenant($filters, $request->integer('per_page', 15)),
            'filters' => $filters,
        ]);
    }

    public function create(Request $request): Response
    {
        $placement = null;
        if ($request->filled('placement_id')) {
            $placement = Placement::forTenant($request->user()->tenant_id)
                ->with([
                    'customer',
                    'markets.insuranceCompany',
                    'markets.brokerSlips' => fn ($q) => $q->whereNotIn('status', ['superseded', 'withdrawn']),
                    'policyProduct.policyClass',
                    'policyProduct.policyType',
                ])
                ->findOrFail($request->placement_id);
        }

        return Inertia::render('broker-slips/Create', [
            'placement' => $placement,
            'placements' => Placement::forTenant($request->user()->tenant_id)
                ->with([
                    'customer:id,type,first_name,last_name,company_name',
                    'markets.insuranceCompany:id,name',
                    'markets.brokerSlips' => fn ($q) => $q->whereNotIn('status', ['superseded', 'withdrawn']),
                    'policyProduct.policyClass:id,name',
                ])
                ->whereIn('status', ['draft', 'in_market'])
                ->get(['id', 'placement_number', 'customer_id', 'policy_product_id', 'currency', 'proposed_start_date', 'proposed_end_date', 'total_sum_insured']),
            'clauseLibrary' => ClauseLibrary::active()
                ->where(function ($q) use ($request) {
                    $q->whereNull('tenant_id')
                        ->orWhere('tenant_id', $request->user()->tenant_id);
                })
                ->orderBy('sort_order')
                ->get(),
            'documentTemplates' => collect(config('document-templates.templates', []))->map(fn ($t, $k) => [
                'key' => $k,
                'name' => $t['name'] ?? $k,
                'type' => $t['type'] ?? '',
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'placement_id' => ['required', 'exists:placements,id'],
            'placement_market_id' => [
                'nullable',
                'exists:placement_markets,id',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if ($value && BrokerSlip::where('placement_market_id', $value)
                        ->whereNotIn('status', ['superseded', 'withdrawn'])
                        ->exists()
                    ) {
                        $fail('A broker slip already exists for this insurer. Create a revision instead.');
                    }
                },
            ],
            'currency' => ['nullable', 'string', 'size:3'],
            'sum_insured' => ['required', 'numeric', 'min:0'],
            'rate' => ['nullable', 'numeric', 'min:0'],
            'rate_basis' => ['nullable', 'string', 'in:percentage,per_mille,fixed'],
            'gross_premium' => ['required', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'co_broker_commission' => ['nullable', 'numeric', 'min:0'],
            'reporting_broker_commission' => ['nullable', 'numeric', 'min:0'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'net_premium' => ['required', 'numeric', 'min:0'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after:period_start'],
            'claim_payment_condition' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.item_type' => ['nullable', 'string'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.sum_insured' => ['required_with:items', 'numeric', 'min:0'],
            'clauses' => ['nullable', 'array'],
            'clauses.*.clause_type' => ['required_with:clauses', 'string'],
            'clauses.*.title' => ['required_with:clauses', 'string', 'max:200'],
            'clauses.*.content' => ['required_with:clauses', 'string'],
        ]);

        $slip = $this->brokerSlipService->createSlip($validated);

        return to_route('broker-slips.show', $slip);
    }

    public function createDirect(Request $request): Response
    {
        return Inertia::render('broker-slips/CreateDirect', [
            'customers' => Customer::forTenant($request->user()->tenant_id)
                ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email')
                ->get(),
            'insuranceCompanies' => InsuranceCompany::active()->get(['id', 'name']),
            'policyProducts' => PolicyProduct::forTenant($request->user()->tenant_id)
                ->where('is_active', true)
                ->with('policyClass:id,name')
                ->get(),
            'clauseLibrary' => ClauseLibrary::active()
                ->where(function ($q) use ($request) {
                    $q->whereNull('tenant_id')
                        ->orWhere('tenant_id', $request->user()->tenant_id);
                })
                ->orderBy('sort_order')
                ->get(),
            'documentTemplates' => collect(config('document-templates.templates', []))->map(fn ($t, $k) => [
                'key' => $k,
                'name' => $t['name'] ?? $k,
                'type' => $t['type'] ?? '',
            ])->values(),
        ]);
    }

    public function storeDirect(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'insured_id' => ['nullable', 'exists:customers,id'],
            'policy_product_id' => ['required', 'exists:policy_products,id'],
            'insurance_company_id' => [
                'required',
                'exists:insurance_companies,id',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $duplicate = BrokerSlip::whereHas('placementMarket', function ($q) use ($value) {
                        $q->where('insurance_company_id', $value);
                    })
                        ->whereNotIn('status', ['superseded', 'withdrawn'])
                        ->exists();

                    if ($duplicate) {
                        $fail('A broker slip already exists for this insurer. Create a revision instead.');
                    }
                },
            ],
            'currency' => ['nullable', 'string', 'size:3'],
            'sum_insured' => ['required', 'numeric', 'min:0'],
            'rate' => ['nullable', 'numeric', 'min:0'],
            'rate_basis' => ['nullable', 'string', 'in:percentage,per_mille,fixed'],
            'gross_premium' => ['required', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'co_broker_commission' => ['nullable', 'numeric', 'min:0'],
            'reporting_broker_commission' => ['nullable', 'numeric', 'min:0'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'net_premium' => ['required', 'numeric', 'min:0'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after:period_start'],
            'claim_payment_condition' => ['nullable', 'string'],
            'risk_details' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.item_type' => ['nullable', 'string'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.sum_insured' => ['required_with:items', 'numeric', 'min:0'],
            'clauses' => ['nullable', 'array'],
            'clauses.*.clause_type' => ['required_with:clauses', 'string'],
            'clauses.*.title' => ['required_with:clauses', 'string', 'max:200'],
            'clauses.*.content' => ['required_with:clauses', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $slip = $this->brokerSlipService->createDirectSlip($validated);

        return to_route('broker-slips.show', $slip);
    }

    public function show(BrokerSlip $brokerSlip): Response
    {
        $brokerSlip->load([
            'placement.customer',
            'placement.insured',
            'placement.policyProduct.policyClass',
            'placementMarket.insuranceCompany',
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
        ]);

        return Inertia::render('broker-slips/Show', [
            'brokerSlip' => $brokerSlip,
        ]);
    }

    public function edit(BrokerSlip $brokerSlip): Response
    {
        $brokerSlip->load([
            'placement.customer',
            'placementMarket.insuranceCompany',
            'items' => fn ($q) => $q->orderBy('sort_order'),
            'clauses' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        return Inertia::render('broker-slips/Edit', [
            'brokerSlip' => $brokerSlip,
            'placements' => Placement::forTenant(request()->user()->tenant_id)
                ->with('customer:id,type,first_name,last_name,company_name')
                ->whereIn('status', ['draft', 'in_market', 'placed'])
                ->get(),
            'insuranceCompanies' => InsuranceCompany::active()->get(['id', 'name']),
            'clauseLibrary' => ClauseLibrary::active()
                ->where(function ($q) {
                    $q->whereNull('tenant_id')
                        ->orWhere('tenant_id', request()->user()->tenant_id);
                })
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function update(Request $request, BrokerSlip $brokerSlip): RedirectResponse
    {
        $validated = $request->validate([
            'sum_insured' => ['sometimes', 'numeric', 'min:0'],
            'rate' => ['nullable', 'numeric', 'min:0'],
            'rate_basis' => ['nullable', 'string', 'in:percentage,per_mille,fixed'],
            'gross_premium' => ['sometimes', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'co_broker_commission' => ['nullable', 'numeric', 'min:0'],
            'reporting_broker_commission' => ['nullable', 'numeric', 'min:0'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'net_premium' => ['sometimes', 'numeric', 'min:0'],
            'period_start' => ['sometimes', 'date'],
            'period_end' => ['sometimes', 'date', 'after:period_start'],
            'claim_payment_condition' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'clauses' => ['nullable', 'array'],
        ]);

        $this->brokerSlipService->updateSlip($brokerSlip, $validated);

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function destroy(BrokerSlip $brokerSlip): RedirectResponse
    {
        $brokerSlip->delete();

        return to_route('broker-slips.index');
    }

    public function submitForReview(Request $request, BrokerSlip $brokerSlip): RedirectResponse
    {
        $validated = $request->validate(['notes' => ['nullable', 'string']]);

        $this->brokerSlipService->submitForReview($brokerSlip, $validated['notes'] ?? null);

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function approve(Request $request, BrokerSlip $brokerSlip): RedirectResponse
    {
        $validated = $request->validate(['notes' => ['nullable', 'string']]);

        $approval = $brokerSlip->approvals()->latest()->firstOrFail();
        $approval->approve($validated['notes'] ?? null);

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function requestChanges(Request $request, BrokerSlip $brokerSlip): RedirectResponse
    {
        $validated = $request->validate(['changes' => ['required', 'string']]);

        $approval = $brokerSlip->approvals()->latest()->firstOrFail();
        $approval->requestChanges($validated['changes']);

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function issue(BrokerSlip $brokerSlip): RedirectResponse
    {
        $slip = $this->brokerSlipService->issueSlip($brokerSlip);
        $this->pdfService->savePdf($slip);

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function withdraw(BrokerSlip $brokerSlip): RedirectResponse
    {
        $this->brokerSlipService->withdrawSlip($brokerSlip);

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function createNewVersion(BrokerSlip $brokerSlip): RedirectResponse
    {
        $newSlip = $this->brokerSlipService->createNewVersion($brokerSlip);

        return to_route('broker-slips.edit', $newSlip);
    }

    public function download(BrokerSlip $brokerSlip): \Illuminate\Http\Response
    {
        if (! $brokerSlip->pdf_path || ! Storage::disk('public')->exists($brokerSlip->pdf_path)) {
            $path = $this->pdfService->savePdf($brokerSlip);
        } else {
            $path = $brokerSlip->pdf_path;
        }

        return Storage::disk('public')->download($path, "broker-slip-{$brokerSlip->slip_number}-v{$brokerSlip->version}.pdf");
    }

    public function preview(BrokerSlip $brokerSlip): \Illuminate\Http\Response
    {
        $pdfContent = $this->pdfService->generatePdf($brokerSlip, preview: false);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="preview.pdf"',
        ]);
    }

    public function calculatePremiums(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'sum_insured' => ['required', 'numeric', 'min:0'],
            'rate' => ['nullable', 'numeric', 'min:0'],
            'rate_basis' => ['nullable', 'string', 'in:percentage,per_mille,fixed'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'co_broker_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'reporting_broker_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $grossPremium = $this->calculationService->calculateGrossPremium(
            $validated['sum_insured'],
            $validated['rate'] ?? null,
            $validated['rate_basis'] ?? null,
        );

        $commissionAmount = $this->calculationService->calculateCommission(
            $grossPremium,
            $validated['commission_rate'] ?? null,
        );

        $coBrokerCommission = $validated['co_broker_rate']
            ? $this->calculationService->calculateCommission($grossPremium, $validated['co_broker_rate'])
            : 0;

        $reportingBrokerCommission = $validated['reporting_broker_rate']
            ? $this->calculationService->calculateCommission($grossPremium, $validated['reporting_broker_rate'])
            : 0;

        $netPremium = $this->calculationService->calculateNetPremium(
            $grossPremium,
            $commissionAmount,
            $coBrokerCommission,
            $reportingBrokerCommission,
            $validated['fees'] ?? null,
            $validated['taxes'] ?? null,
            $validated['discount'] ?? null,
        );

        return response()->json([
            'gross_premium' => $grossPremium,
            'commission_amount' => $commissionAmount,
            'co_broker_commission' => $coBrokerCommission,
            'reporting_broker_commission' => $reportingBrokerCommission,
            'net_premium' => $netPremium,
        ]);
    }

    public function htmlPreview(Request $request, BrokerSlip $brokerSlip): \Illuminate\Http\Response
    {
        $templateKey = $request->get('template_key', 'broker_slip.standard');

        $payload = $this->payloadMapper->mapBrokerSlip($brokerSlip);

        $html = $this->pdfGenerator->renderHtml(
            tenant: $brokerSlip->tenant,
            templateKey: $templateKey,
            payload: $payload,
            isPreview: true,
        );

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
        ]);
    }

    public function verify(BrokerSlip $brokerSlip): Response
    {
        $brokerSlip->load([
            'placement.customer',
            'placementMarket.insuranceCompany',
            'items',
            'clauses',
            'versions' => fn ($q) => $q->latest()->limit(5),
        ]);

        return Inertia::render('broker-slips/Verify', [
            'brokerSlip' => $brokerSlip,
            'checksumValid' => $brokerSlip->snapshot_json
                ? hash('sha256', $brokerSlip->snapshot_json) === $brokerSlip->checksum
                : null,
        ]);
    }
}
