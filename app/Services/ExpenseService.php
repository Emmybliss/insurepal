<?php

namespace App\Services;

use App\Models\Expense;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ExpenseService
{
    /**
     * Create a new expense.
     */
    public function createExpense(int $tenantId, int $userId, array $data, ?UploadedFile $receipt = null): Expense
    {
        if ($receipt) {
            $data['receipt_path'] = $receipt->store('expenses/receipts', 'public');
        }

        $data['tenant_id'] = $tenantId;
        $data['user_id'] = $userId;

        return Expense::create($data);
    }

    /**
     * Update an existing expense.
     */
    public function updateExpense(Expense $expense, array $data, ?UploadedFile $receipt = null): Expense
    {
        if ($receipt) {
            // Delete old receipt if exists
            if ($expense->receipt_path) {
                Storage::disk('public')->delete($expense->receipt_path);
            }
            $data['receipt_path'] = $receipt->store('expenses/receipts', 'public');
        }

        $expense->update($data);

        return $expense;
    }

    /**
     * Delete an expense.
     */
    public function deleteExpense(Expense $expense): bool
    {
        if ($expense->receipt_path) {
            Storage::disk('public')->delete($expense->receipt_path);
        }

        return $expense->delete();
    }

    /**
     * Get expenses for a tenant with filters.
     */
    public function getTenantExpenses(int $tenantId, array $filters = [])
    {
        $query = Expense::where('tenant_id', $tenantId)
            ->with('user');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['date_from'])) {
            $query->where('expense_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->where('expense_date', '<=', $filters['date_to']);
        }

        return $query;
    }
}
