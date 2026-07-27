<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CustomerLookupService
{
    /**
     * Search existing tenant customers by name, email, or phone.
     */
    public function search(int $tenantId, ?string $query, int $limit = 20): Collection
    {
        if (empty($query)) {
            return Customer::where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->latest()
                ->limit($limit)
                ->get();
        }

        $term = trim($query);

        return Customer::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->where(function ($q) use ($term) {
                $q->where('first_name', 'like', "%{$term}%")
                    ->orWhere('last_name', 'like', "%{$term}%")
                    ->orWhere('company_name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")
                    ->orWhere(DB::raw("CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))"), 'like', "%{$term}%");
            })
            ->limit($limit)
            ->get();
    }

    /**
     * Quick create customer with minimal fields.
     */
    public function quickCreate(int $tenantId, array $data): Customer
    {
        $companyName = isset($data['company_name']) ? trim($data['company_name']) : null;
        $firstName = isset($data['first_name']) ? trim($data['first_name']) : null;
        $lastName = isset($data['last_name']) ? trim($data['last_name']) : null;

        $type = $data['type'] ?? (! empty($companyName) ? 'corporate' : 'individual');

        return Customer::create([
            'tenant_id' => $tenantId,
            'type' => $type,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'company_name' => $companyName,
            'email' => isset($data['email']) ? trim($data['email']) : null,
            'phone' => isset($data['phone']) ? trim($data['phone']) : null,
            'is_active' => true,
        ]);
    }
}
