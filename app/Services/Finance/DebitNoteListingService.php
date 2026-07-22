<?php

namespace App\Services\Finance;

use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\User;
use App\Services\Concerns\HandlesListing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DebitNoteListingService
{
    use HandlesListing;

    protected const ALLOWED_SORT_COLUMNS = [
        'note_number', 'amount', 'total_amount', 'status',
        'due_date', 'issue_date', 'created_at',
    ];

    public function list(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = DebitNote::query()
            ->where('tenant_id', $user->tenant_id)
            ->with(['customer', 'policy', 'createdBy'])
            ->latest();

        $query = $this->applySearch($query, $filters['search'] ?? null, [
            'note_number',
            'customer.first_name',
            'customer.last_name',
            'customer.company_name',
        ]);
        $query = $this->applyStatusFilter($query, $filters['status'] ?? null);
        $query = $this->applyCustomerFilter($query, $filters['customer_id'] ?? null);
        $query = $this->applyDateRange($query, $filters['date_from'] ?? null, $filters['date_to'] ?? null);
        $query = $this->applySort($query, $filters['sort'] ?? null, self::ALLOWED_SORT_COLUMNS);

        return $this->applyPagination($query, $perPage);
    }

    public function getCreateData(User $user): array
    {
        $nextNoteNumber = DebitNote::generateDebitNoteNumber($user->tenant_id);

        $customers = Customer::where('tenant_id', $user->tenant_id)
            ->active()
            ->get(['id', 'first_name', 'last_name', 'company_name', 'type', 'email']);

        return [
            'lastNoteNumber' => $nextNoteNumber,
            'customers' => $customers,
        ];
    }

    public function getStats(User $user): array
    {
        $base = DebitNote::where('tenant_id', $user->tenant_id);

        return [
            'total_debit' => (clone $base)->sum('total_amount'),
            'outstanding_debit' => (clone $base)->where('status', DebitNote::STATUS_ISSUED)->sum('total_amount'),
            'overdue_count' => (clone $base)
                ->where('status', DebitNote::STATUS_ISSUED)
                ->where('due_date', '<', now())
                ->count(),
        ];
    }

    protected function applyStatusFilter($query, ?string $status)
    {
        return $status ? $query->where('status', $status) : $query;
    }

    protected function applyCustomerFilter($query, ?int $customerId)
    {
        return $customerId ? $query->where('customer_id', $customerId) : $query;
    }
}
