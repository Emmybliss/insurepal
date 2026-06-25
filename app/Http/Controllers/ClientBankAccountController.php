<?php

namespace App\Http\Controllers;

use App\Models\ClientBankAccount;
use App\Services\Naicom\BankAccountService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientBankAccountController extends Controller
{
    public function __construct(
        protected BankAccountService $bankAccountService,
    ) {}

    public function index()
    {
        $this->authorize('naicom-reports.view');

        $accounts = ClientBankAccount::query()
            ->where('tenant_id', auth()->user()->tenant_id)
            ->withCount('reconciliations')
            ->latest()
            ->paginate(15);

        return Inertia::render('accounts/client-bank-accounts/index', [
            'accounts' => $accounts,
        ]);
    }

    public function create()
    {
        $this->authorize('naicom-reports.generate');

        return Inertia::render('accounts/client-bank-accounts/create');
    }

    public function store(Request $request)
    {
        $this->authorize('naicom-reports.generate');

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'account_type' => 'required|in:savings,current',
            'currency' => 'required|string|size:3',
            'is_active' => 'boolean',
            'opening_balance' => 'required|numeric|min:0',
            'opening_balance_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $validated['tenant_id'] = auth()->user()->tenant_id;

        $this->bankAccountService->create($validated);

        return redirect()->route('client-bank-accounts.index')
            ->with('success', 'Bank account created successfully.');
    }

    public function show(ClientBankAccount $clientBankAccount)
    {
        $this->authorize('naicom-reports.view');

        $clientBankAccount->load('reconciliations');

        return Inertia::render('accounts/client-bank-accounts/show', [
            'account' => $clientBankAccount,
            'currentBalance' => $this->bankAccountService->getCurrentBalance($clientBankAccount),
        ]);
    }

    public function edit(ClientBankAccount $clientBankAccount)
    {
        $this->authorize('naicom-reports.generate');

        return Inertia::render('accounts/client-bank-accounts/edit', [
            'account' => $clientBankAccount,
        ]);
    }

    public function update(Request $request, ClientBankAccount $clientBankAccount)
    {
        $this->authorize('naicom-reports.generate');

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'account_type' => 'required|in:savings,current',
            'currency' => 'required|string|size:3',
            'is_active' => 'boolean',
            'opening_balance' => 'required|numeric|min:0',
            'opening_balance_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $this->bankAccountService->update($clientBankAccount, $validated);

        return redirect()->route('client-bank-accounts.index')
            ->with('success', 'Bank account updated successfully.');
    }

    public function destroy(ClientBankAccount $clientBankAccount)
    {
        $this->authorize('naicom-reports.lock');

        if ($clientBankAccount->reconciliations()->exists()) {
            return back()->with('error', 'Cannot delete account with existing reconciliations.');
        }

        $clientBankAccount->delete();

        return redirect()->route('client-bank-accounts.index')
            ->with('success', 'Bank account deleted.');
    }
}
