<?php

namespace App\Http\Controllers;

use App\Models\BankReconciliation;
use App\Models\ClientBankAccount;
use App\Services\Naicom\BankReconciliationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BankReconciliationController extends Controller
{
    public function __construct(
        protected BankReconciliationService $reconciliationService,
    ) {}

    public function index()
    {
        $this->authorize('naicom-reports.view');

        $reconciliations = BankReconciliation::query()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->with(['clientBankAccount', 'reconciledBy'])
            ->latest()
            ->paginate(15);

        return Inertia::render('accounts/bank-reconciliations/index', [
            'reconciliations' => $reconciliations,
        ]);
    }

    public function create()
    {
        $this->authorize('naicom-reports.generate');

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('accounts/bank-reconciliations/create', [
            'bankAccounts' => ClientBankAccount::where('tenant_id', $tenantId)->where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('naicom-reports.generate');

        $validated = $request->validate([
            'client_bank_account_id' => 'required|exists:client_bank_accounts,id',
            'reconciliation_date' => 'required|date',
            'closing_balance' => 'nullable|numeric',
        ]);

        $reconciliation = $this->reconciliationService->create(
            auth()->user()->tenant_id,
            $validated['client_bank_account_id'],
            $validated['reconciliation_date'],
            $validated['closing_balance'] ?? null,
        );

        return redirect()->route('bank-reconciliations.show', $reconciliation)
            ->with('success', 'Reconciliation created. Auto-matching in progress.');
    }

    public function show(BankReconciliation $bankReconciliation)
    {
        $this->authorize('naicom-reports.view');

        $bankReconciliation->load(['clientBankAccount', 'reconciledBy', 'lines']);

        return Inertia::render('accounts/bank-reconciliations/show', [
            'reconciliation' => $bankReconciliation,
        ]);
    }

    public function matchLines(Request $request, BankReconciliation $bankReconciliation)
    {
        $this->authorize('naicom-reports.generate');

        $lines = $this->reconciliationService->autoMatch($bankReconciliation);

        return back()->with('success', 'Auto-matched '.$lines->count().' transactions.');
    }

    public function reconcile(Request $request, BankReconciliation $bankReconciliation)
    {
        $this->authorize('naicom-reports.approve');

        $validated = $request->validate([
            'actual_closing_balance' => 'nullable|numeric',
        ]);

        $this->reconciliationService->reconcile(
            $bankReconciliation,
            auth()->id(),
            $validated['actual_closing_balance'] ?? null,
        );

        $message = $bankReconciliation->fresh()->status === 'reconciled'
            ? 'Account reconciled successfully.'
            : 'Reconciliation completed with a difference of '.number_format($bankReconciliation->fresh()->difference, 2).'.';

        return back()->with('success', $message);
    }

    public function markMatched(BankReconciliation $bankReconciliation, $lineId)
    {
        $this->authorize('naicom-reports.generate');

        $line = $bankReconciliation->lines()->findOrFail($lineId);
        $this->reconciliationService->markLineMatched($line);

        return back()->with('success', 'Line marked as matched.');
    }
}
