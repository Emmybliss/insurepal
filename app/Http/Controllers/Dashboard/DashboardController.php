<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\Quote;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Super admins should use their own dashboard
        if ($user->isSuperAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        if (! $user->tenant) {
            abort(403, 'No tenant access');
        }

        // Check if tenant is active
        if (! $user->tenant->isActive()) {
            abort(403, 'Tenant account is not active');
        }

        // Customer users should always see the customer dashboard,
        // regardless of which tenant type (underwriter / broker) they belong to.
        if ($user->isCustomer()) {
            return $this->customerDashboard($user, $user->tenant);
        }

        if ($user->tenant->type === 'underwriter') {
            return $this->underwriterDashboard($user->tenant);
        }

        if ($user->tenant->type === 'broker') {
            return $this->brokerDashboard($user->tenant);
        }

        // Default customer dashboard
        return $this->customerDashboard($user, $user->tenant);
    }

    private function customerDashboard($user, $tenant)
    {
        // Find customer record linked to this user
        $customer = Customer::where('user_id', $user->id)->with('kyc')->first();

        if (! $customer) {
            abort(404, 'Customer profile not found');
        }

        $stats = [
            'total_quotes' => $customer->quotes()->count(),
            'total_policies' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->count(),
            'active_policies' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->active()->count(),
            'total_premium' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->active()->sum('premium_amount'),
            'expiring_policies' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->expiring(60)->count(),
            'expired_policies' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->expired()->count(),
            'total_claims' => Claim::forCustomer($customer->id)->count(),
            'pending_claims' => Claim::forCustomer($customer->id)->pending()->count(),
        ];

        return Inertia::render('dashboard/customer', [
            'user' => $user,
            'tenant' => $tenant->only(['name', 'type', 'logo']),
            'customer' => $customer,
            'kyc' => $customer->kyc,
            'stats' => $stats,
            'policies' => Policy::forTenant($tenant->id)
                ->where('customer_id', $customer->id)
                ->active()
                ->with(['policyType'])
                ->latest()
                ->limit(5)
                ->get(),
            'recent_quotes' => $customer->quotes()
                ->latest()
                ->limit(3)
                ->get(),
            'recent_claims' => Claim::forCustomer($customer->id)
                ->with(['policy'])
                ->latest()
                ->limit(4)
                ->get(),
        ]);
    }

    private function underwriterDashboard($tenant)
    {
        $stats = [
            'total_customers' => Customer::forTenant($tenant->id)->count(),
            'total_quotes' => Quote::forTenant($tenant->id)->count(),
            'total_policies' => Policy::forTenant($tenant->id)->count(),
            'active_policies' => Policy::forTenant($tenant->id)->active()->count(),
            'monthly_premium' => Policy::forTenant($tenant->id)
                ->active()
                ->sum('premium_amount'),
            'expiring_policies' => Policy::forTenant($tenant->id)->expiring(60)->count(),
            'expired_policies' => Policy::forTenant($tenant->id)->expired()->count(),
        ];

        return Inertia::render('dashboard/underwriter', [
            'tenant' => $tenant,
            'stats' => $stats,
            'premium_trends' => $this->getPremiumTrends($tenant),
            'recent_quotes' => Quote::forTenant($tenant->id)
                ->with(['customer', 'insuranceProduct'])
                ->latest()
                ->limit(5)
                ->get(),
            'expiring_policies' => Policy::forTenant($tenant->id)
                ->expiring(60)
                ->with('customer')
                ->limit(10)
                ->get(),
        ]);
    }

    private function brokerDashboard($tenant)
    {
        $stats = [
            'total_customers' => Customer::forTenant($tenant->id)->count(),
            'total_quotes' => Quote::forTenant($tenant->id)->count(),
            'total_policies' => Policy::forTenant($tenant->id)->count(),
            'active_policies' => Policy::forTenant($tenant->id)->active()->count(),
            'commission_earned' => Policy::forTenant($tenant->id)
                ->active()
                ->sum('commission_amount'),
            'expiring_policies' => Policy::forTenant($tenant->id)->expiring(60)->count(),
            'expired_policies' => Policy::forTenant($tenant->id)->expired()->count(),
        ];

        return Inertia::render('dashboard/broker', [
            'tenant' => $tenant,
            'stats' => $stats,
            'premium_trends' => $this->getPremiumTrends($tenant),
            'recent_quotes' => Quote::forTenant($tenant->id)
                ->with(['customer', 'insuranceProduct'])
                ->latest()
                ->limit(5)
                ->get(),
            'customers' => Customer::forTenant($tenant->id)
                ->latest()
                ->limit(10)
                ->get(),
            'expiring_policies' => Policy::forTenant($tenant->id)
                ->expiring(60)
                ->with('customer')
                ->limit(10)
                ->get(),
        ]);
    }

    private function getPremiumTrends($tenant)
    {
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $months->push(now()->subMonths($i)->format('M'));
        }

        $policyTypes = \App\Models\PolicyType::active()->get();

        $trends = $months->map(function ($monthName, $index) use ($tenant, $policyTypes) {
            $startDate = now()->subMonths(5 - $index)->startOfMonth();
            $endDate = now()->subMonths(5 - $index)->endOfMonth();

            $data = ['month' => $monthName];

            foreach ($policyTypes as $type) {
                $premium = Policy::forTenant($tenant->id)
                    ->where('policy_type_id', $type->id)
                    ->active()
                    ->whereBetween('issued_at', [$startDate, $endDate])
                    ->sum('premium_amount');

                $data[strtolower($type->code)] = (float) $premium;
            }

            return $data;
        });

        return [
            'data' => $trends,
            'categories' => $policyTypes->map(fn ($type) => [
                'name' => $type->name,
                'key' => strtolower($type->code),
            ]),
        ];
    }
}
