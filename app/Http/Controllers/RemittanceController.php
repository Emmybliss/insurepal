<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRemittanceRequest;
use App\Models\ClientBankAccount;
use App\Models\InsuranceCompany;
use App\Models\Remittance;
use App\Services\Naicom\RemittanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RemittanceController extends Controller
{
    public function __construct(
        protected RemittanceService $remittanceService,
    ) {}

    public function index()
    {
        $this->authorize('naicom-reports.view');

        $remittances = Remittance::query()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->with(['insurer', 'clientBankAccount', 'createdBy'])
            ->latest()
            ->paginate(15);

        return Inertia::render('accounts/remittances/index', [
            'remittances' => $remittances,
        ]);
    }

    public function create()
    {
        $this->authorize('naicom-reports.generate');

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('accounts/remittances/create', [
            'bankAccounts' => ClientBankAccount::where('tenant_id', $tenantId)->where('is_active', true)->get(),
            'insurers' => InsuranceCompany::where('tenant_id', $tenantId)->get(),
            'nextRemittanceNumber' => $this->remittanceService->generateRemittanceNumber($tenantId),
        ]);
    }

    public function store(StoreRemittanceRequest $request)
    {
        $this->authorize('naicom-reports.generate');

        $validated = $request->validated();

        $validated['tenant_id'] = auth()->user()->tenant_id;
        $validated['created_by'] = auth()->id();
        $validated['status'] = 'draft';

        $this->remittanceService->create($validated);

        return redirect()->route('remittances.index')
            ->with('success', 'Remittance created successfully.');
    }

    public function show(Remittance $remittance)
    {
        $this->authorize('naicom-reports.view');

        $remittance->load(['allocations', 'insurer', 'clientBankAccount', 'createdBy', 'reversedBy']);

        return Inertia::render('accounts/remittances/show', [
            'remittance' => $remittance,
        ]);
    }

    public function complete(Remittance $remittance)
    {
        $this->authorize('naicom-reports.generate');

        $this->remittanceService->markCompleted($remittance);

        return back()->with('success', 'Remittance marked as completed.');
    }

    public function reverse(Request $request, Remittance $remittance)
    {
        $this->authorize('naicom-reports.lock');

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]); // single field — leave inline

        try {
            $this->remittanceService->reverse($remittance, auth()->id(), $validated['reason']);

            return back()->with('success', 'Remittance reversed successfully.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
