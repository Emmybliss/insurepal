<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CustomerService
{
    /**
     * Create a new customer for a tenant.
     */
    public function createCustomer(int $tenantId, array $data): array
    {
        return DB::transaction(function () use ($tenantId, $data) {
            // Handle name based on customer type
            $name = $data['type'] === 'corporate'
                ? $data['company_name']
                : trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));

            $customer = Customer::create([
                'tenant_id' => $tenantId,
                'type' => $data['type'],
                'first_name' => $data['first_name'] ?? null,
                'last_name' => $data['last_name'] ?? null,
                'company_name' => $data['company_name'] ?? null,
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'occupation' => $data['occupation'] ?? null,
                'annual_income' => $data['annual_income'] ?? null,
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
                'country' => $data['country'] ?? 'Nigeria',
                'status' => $data['status'] ?? true,
                'logo' => $data['logo'] ?? null,
            ]);

            // Automatically provision login access only if email is provided
            $credentials = null;
            if (! empty($data['email'])) {
                $credentials = $this->provisionLoginAccess($customer, true);
            }

            return [
                'customer' => $customer,
                'credentials' => $credentials,
            ];
        });
    }

    /**
     * Provision login access for a customer.
     */
    public function provisionLoginAccess(Customer $customer, bool $sendEmail = true): array
    {
        // If the customer already has a linked user, just re-enable access
        if ($customer->user_id) {
            $user = $customer->user;

            if ($user->login_access) {
                throw new \Exception('Customer already has login access.');
            }

            // Re-enable existing account — password is preserved
            $user->update(['login_access' => true]);

            return [
                'user' => $user,
                'email' => $customer->email,
                'password' => null, // password unchanged, not shown again
                'login_url' => route('login'),
            ];
        }

        return DB::transaction(function () use ($customer, $sendEmail) {
            // Generate a temporary password
            $temporaryPassword = Str::random(12);

            // Get customer name
            $name = $customer->type === 'corporate'
                ? $customer->company_name
                : trim(($customer->first_name ?? '').' '.($customer->last_name ?? ''));

            // Create user account
            $user = User::create([
                'name' => $name,
                'email' => $customer->email,
                'password' => Hash::make($temporaryPassword),
                'tenant_id' => $customer->tenant_id,
                'role' => 'customer',
                'is_super_admin' => false,
                'login_access' => true,
            ]);

            // Assign customer role
            $user->assignRole('customer');

            // Link customer to user
            $customer->update(['user_id' => $user->id]);

            event(new Registered($user));

            // Send email with login credentials if requested
            if ($sendEmail) {
                Mail::to($customer->email)->send(
                    new \App\Mail\CustomerLoginCredentials($customer, $temporaryPassword)
                );
            }

            return [
                'user' => $user,
                'email' => $customer->email,
                'password' => $temporaryPassword,
                'login_url' => route('login'),
            ];
        });
    }

    /**
     * Revoke login access for a customer.
     */
    public function revokeLoginAccess(Customer $customer): bool
    {
        if (! $customer->user_id) {
            throw new \Exception('Customer does not have login access.');
        }

        // Soft-disable: just flip the flag — password is preserved
        $customer->user->update(['login_access' => false]);

        // Invalidate all active sessions for this user
        DB::table('sessions')->where('user_id', $customer->user->id)->delete();

        return true;
    }

    /**
     * Reset customer password and send new credentials.
     */
    public function resetCustomerPassword(Customer $customer): string
    {
        if (! $customer->user_id) {
            throw new \Exception('Customer does not have login access.');
        }

        $temporaryPassword = Str::random(12);

        $customer->user->update([
            'password' => Hash::make($temporaryPassword),
        ]);

        Mail::to($customer->email)->send(
            new \App\Mail\CustomerPasswordReset($customer, $temporaryPassword)
        );

        return $temporaryPassword;
    }

    /**
     * Get customers for a tenant with filtering.
     */
    public function getTenantCustomers(int $tenantId, array $filters = [])
    {
        $query = Customer::forTenant($tenantId)
            ->with(['user', 'policies', 'quotes']);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['has_access'])) {
            if ($filters['has_access'] === 'yes') {
                $query->whereNotNull('user_id');
            } else {
                $query->whereNull('user_id');
            }
        }

        return $query;
    }

    /**
     * Get customer statistics for a tenant.
     */
    public function getTenantCustomerStats(int $tenantId): array
    {
        $customers = Customer::forTenant($tenantId);

        return [
            'total' => $customers->count(),
            'individual' => $customers->individual()->count(),
            'corporate' => $customers->corporate()->count(),
            'active' => $customers->active()->count(),
            'with_access' => $customers->whereNotNull('user_id')->count(),
            'without_access' => $customers->whereNull('user_id')->count(),
        ];
    }
}
