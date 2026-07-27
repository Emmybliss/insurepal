<?php

namespace App\Http\Controllers;

use App\Http\Requests\BrokerSlipPremiumCalculationRequest;
use App\Http\Requests\Shared\NotesActionRequest;
use App\Http\Requests\StoreBrokerSlipRequest;
use App\Http\Requests\StoreDirectBrokerSlipRequest;
use App\Http\Requests\UpdateBrokerSlipRequest;
use App\Models\BrokerSlip;
use App\Models\ClauseLibrary;
use App\Models\Customer;
use App\Models\InsuranceCompany;
use App\Models\Placement;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
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
        $this->middleware('tenant.type:broker')->except(['verify']);
    }

    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status']);

        return Inertia::render('broker-slips/Index', [
            'brokerSlips' => $this->brokerSlipService->getSlipsForTenant($request->user(), $filters, $request->integer('per_page', 15)),
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
                    'policyProduct.policyClass:id,name,risk_mode',
                ])
                ->whereIn('status', ['draft', 'in_market'])
                ->get(['id', 'placement_number', 'customer_id', 'policy_product_id', 'currency', 'proposed_start_date', 'proposed_end_date', 'total_sum_insured']),
            'policyTypes' => PolicyType::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'policyClasses' => \App\Models\PolicyClass::select('id', 'name', 'risk_mode', 'policy_type_id')->get(),
            'policyProducts' => \App\Models\PolicyProduct::forTenant($request->user()->tenant_id)
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

    public function store(StoreBrokerSlipRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $slip = $this->brokerSlipService->createSlip($request->user(), $validated);

        return to_route('broker-slips.show', $slip);
    }

    public function createDirect(Request $request): Response
    {
        return Inertia::render('broker-slips/CreateDirect', [
            'customers' => Customer::forTenant($request->user()->tenant_id)
                ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email')
                ->get(),
            'policyTypes' => PolicyType::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'policyClasses' => \App\Models\PolicyClass::select('id', 'name', 'risk_mode', 'policy_type_id')->get(),
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

    public function storeDirect(StoreDirectBrokerSlipRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $slip = $this->brokerSlipService->createDirectSlip($request->user(), $validated);

        return to_route('broker-slips.show', $slip);
    }

    public function show(BrokerSlip $brokerSlip): Response
    {
        $brokerSlip->load([
            'placement.customer',
            'placement.insured',
            'placement.policyClass',
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
            'placement.policyClass',
            'placement.policyProduct.policyClass',
            'placement.policyProduct.policyType',
            'placementMarket.insuranceCompany',
            'items' => fn ($q) => $q->orderBy('sort_order'),
            'clauses' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        return Inertia::render('broker-slips/Edit', [
            'brokerSlip' => $brokerSlip,
            'customers' => \App\Models\Customer::forTenant(request()->user()->tenant_id)
                ->select('id', 'type', 'first_name', 'last_name', 'company_name', 'email')
                ->get(),
            'placements' => Placement::forTenant(request()->user()->tenant_id)
                ->with('customer:id,type,first_name,last_name,company_name')
                ->whereIn('status', ['draft', 'in_market', 'placed'])
                ->get(),
            'insuranceCompanies' => InsuranceCompany::active()->get(['id', 'name']),
            'policyTypes' => PolicyType::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'policyClasses' => \App\Models\PolicyClass::select('id', 'name', 'risk_mode', 'policy_type_id')->get(),
            'policyProducts' => \App\Models\PolicyProduct::forTenant(request()->user()->tenant_id)
                ->where('is_active', true)
                ->with('policyClass:id,name')
                ->get(),
            'clauseLibrary' => ClauseLibrary::active()
                ->where(function ($q) {
                    $q->whereNull('tenant_id')
                        ->orWhere('tenant_id', request()->user()->tenant_id);
                })
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function update(UpdateBrokerSlipRequest $request, BrokerSlip $brokerSlip): RedirectResponse
    {
        $validated = $request->validated();

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
        $validated = $request->validate(['notes' => ['nullable', 'string']]); // single field — leave inline

        $this->brokerSlipService->submitForReview($brokerSlip, $request->user(), $validated['notes'] ?? null);

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function approve(NotesActionRequest $request, BrokerSlip $brokerSlip): RedirectResponse
    {
        $approval = $brokerSlip->approvals()->latest()->firstOrFail();
        $approval->approve($request->validated('notes'));

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function requestChanges(Request $request, BrokerSlip $brokerSlip): RedirectResponse
    {
        $validated = $request->validate(['changes' => ['required', 'string']]); // single field — leave inline

        $approval = $brokerSlip->approvals()->latest()->firstOrFail();
        $approval->requestChanges($validated['changes']);

        return to_route('broker-slips.show', $brokerSlip);
    }

    public function issue(Request $request, BrokerSlip $brokerSlip): RedirectResponse
    {
        $slip = $this->brokerSlipService->issueSlip($brokerSlip, $request->user());
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

    public function download(BrokerSlip $brokerSlip): \Symfony\Component\HttpFoundation\Response
    {
        $path = $this->pdfService->savePdf($brokerSlip);

        $fullPath = Storage::disk('public')->path($path);
        if (! file_exists($fullPath)) {
            abort(404);
        }

        $content = file_get_contents($fullPath);
        $fileName = "broker-slip-{$brokerSlip->slip_number}-v{$brokerSlip->version}.pdf";

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            'Content-Length' => strlen($content),
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    public function preview(BrokerSlip $brokerSlip): \Illuminate\Http\Response
    {
        $pdfContent = $this->pdfService->generatePdf($brokerSlip, preview: false);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="preview.pdf"',
        ]);
    }

    public function calculatePremiums(BrokerSlipPremiumCalculationRequest $request): \Illuminate\Http\JsonResponse
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
        $pdfContent = $this->pdfService->generatePdf($brokerSlip, preview: true);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="preview.pdf"',
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
