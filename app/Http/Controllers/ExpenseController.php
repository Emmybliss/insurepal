<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    protected $expenseService;

    public function __construct(ExpenseService $expenseService)
    {
        $this->expenseService = $expenseService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Expense::class);

        $expenses = $this->expenseService->getTenantExpenses(
            Auth::user()->tenant_id,
            $request->all()
        )->paginate(10)->withQueryString();

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'filters' => $request->all(['search', 'category', 'status', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $this->authorize('create', Expense::class);

        return Inertia::render('Expenses/Create', [
            'categories' => config('insurance.expense_categories', [
                'Travel', 'Meals', 'Office Supplies', 'Marketing', 'Utilities', 'Miscellaneous',
            ]),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Expense::class);

        $validated = $request->validate([
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
            'description' => 'nullable|string',
            'expense_date' => 'required|date',
            'receipt' => 'nullable|image|max:2048',
        ]);

        $this->expenseService->createExpense(
            Auth::user()->tenant_id,
            Auth::id(),
            $validated,
            $request->file('receipt')
        );

        return redirect()->route('expenses.index')
            ->with('success', 'Expense created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Expense $expense)
    {
        $this->authorize('update', $expense);

        return Inertia::render('Expenses/Edit', [
            'expense' => $expense,
            'categories' => config('insurance.expense_categories', [
                'Travel', 'Meals', 'Office Supplies', 'Marketing', 'Utilities', 'Miscellaneous',
            ]),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Expense $expense)
    {
        $this->authorize('update', $expense);

        $validated = $request->validate([
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|size:3',
            'description' => 'nullable|string',
            'expense_date' => 'required|date',
            'receipt' => 'nullable|image|max:2048',
        ]);

        $this->expenseService->updateExpense(
            $expense,
            $validated,
            $request->file('receipt')
        );

        return redirect()->route('expenses.index')
            ->with('success', 'Expense updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Expense $expense)
    {
        $this->authorize('delete', $expense);

        $this->expenseService->deleteExpense($expense);

        return redirect()->route('expenses.index')
            ->with('success', 'Expense deleted successfully.');
    }
}
