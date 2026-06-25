<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found',
            ], 422);
        }

        $tenantType = $tenant->type;

        if ($user->isCustomer()) {
            return $this->customerDashboard($user, $tenant);
        }

        if ($tenantType === 'underwriter') {
            return $this->underwriterDashboard($user, $tenant);
        }

        if ($tenantType === 'broker') {
            return $this->brokerDashboard($user, $tenant);
        }

        return $this->brokerDashboard($user, $tenant);
    }

    private function customerDashboard($user, $tenant)
    {
        $customer = Customer::where('user_id', $user->id)->first();

        if (! $customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found',
            ], 422);
        }

        $stats = [
            'total_quotes' => $customer->quotes()->count(),
            'total_policies' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->count(),
            'active_policies' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->active()->count(),
            'total_premium' => (float) Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->active()->sum('premium_amount'),
            'expiring_policies' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->expiring(60)->count(),
            'expired_policies' => Policy::forTenant($tenant->id)->where('customer_id', $customer->id)->expired()->count(),
            'total_claims' => Claim::forCustomer($customer->id)->count(),
            'pending_claims' => Claim::forCustomer($customer->id)->pending()->count(),
        ];

        $policies = Policy::forTenant($tenant->id)
            ->where('customer_id', $customer->id)
            ->active()
            ->with(['policyType'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'policy_number' => $p->policy_number,
                'status' => $p->status,
                'expiry_date' => $p->expiry_date?->toISOString(),
                'premium_amount' => (float) $p->premium_amount,
                'policy_type' => $p->policyType ? ['name' => $p->policyType->name] : null,
            ]);

        $recentQuotes = $customer->quotes()
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn ($q) => [
                'id' => $q->id,
                'quote_number' => $q->quote_number,
                'status' => $q->status,
                'premium_amount' => (float) $q->premium_amount,
                'valid_until' => $q->valid_until?->toISOString(),
            ]);

        $recentClaims = Claim::forCustomer($customer->id)
            ->with(['policy'])
            ->latest()
            ->limit(4)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'claim_reference' => $c->claim_reference,
                'status' => $c->status,
                'claim_amount' => (float) $c->claim_amount,
                'claim_type' => $c->claim_type,
                'incident_date' => $c->incident_date?->toISOString(),
                'policy' => $c->policy ? ['policy_number' => $c->policy->policy_number] : null,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data fetched successfully',
            'data' => [
                'tenant_type' => 'customer',
                'tenant' => [
                    'name' => $tenant->name,
                    'type' => $tenant->type,
                ],
                'stats' => $stats,
                'policies' => $policies,
                'recent_quotes' => $recentQuotes,
                'recent_claims' => $recentClaims,
            ],
        ]);
    }

    private function underwriterDashboard($user, $tenant)
    {
        $stats = [
            'total_customers' => Customer::forTenant($tenant->id)->count(),
            'total_quotes' => Quote::forTenant($tenant->id)->count(),
            'total_policies' => Policy::forTenant($tenant->id)->count(),
            'active_policies' => Policy::forTenant($tenant->id)->active()->count(),
            'monthly_premium' => (float) Policy::forTenant($tenant->id)->active()->sum('premium_amount'),
            'expiring_policies' => Policy::forTenant($tenant->id)->expiring(60)->count(),
            'expired_policies' => Policy::forTenant($tenant->id)->expired()->count(),
        ];

        $recentQuotes = Quote::forTenant($tenant->id)
            ->with(['customer', 'insuranceProduct'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($q) => [
                'id' => $q->id,
                'quote_number' => $q->quote_number,
                'customer' => [
                    'id' => $q->customer?->id,
                    'first_name' => $q->customer?->first_name,
                    'last_name' => $q->customer?->last_name,
                    'company_name' => $q->customer?->company_name,
                    'type' => $q->customer?->type,
                ],
                'insurance_product' => $q->insuranceProduct ? [
                    'name' => $q->insuranceProduct->name,
                    'type' => $q->insuranceProduct->type,
                ] : null,
                'status' => $q->status,
                'premium_amount' => (float) $q->premium_amount,
                'valid_until' => $q->valid_until?->toISOString(),
            ]);

        $expiringPolicies = Policy::forTenant($tenant->id)
            ->expiring(60)
            ->with('customer')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'policy_number' => $p->policy_number,
                'customer' => [
                    'id' => $p->customer?->id,
                    'first_name' => $p->customer?->first_name,
                    'last_name' => $p->customer?->last_name,
                    'company_name' => $p->customer?->company_name,
                    'type' => $p->customer?->type,
                ],
                'expiry_date' => $p->expiry_date?->toISOString(),
                'premium_amount' => (float) $p->premium_amount,
                'status' => $p->status,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data fetched successfully',
            'data' => [
                'tenant_type' => 'underwriter',
                'tenant' => [
                    'name' => $tenant->name,
                    'type' => $tenant->type,
                ],
                'stats' => $stats,
                'recent_quotes' => $recentQuotes,
                'expiring_policies' => $expiringPolicies,
            ],
        ]);
    }

    private function brokerDashboard($user, $tenant)
    {
        $stats = [
            'total_customers' => Customer::forTenant($tenant->id)->count(),
            'total_quotes' => Quote::forTenant($tenant->id)->count(),
            'total_policies' => Policy::forTenant($tenant->id)->count(),
            'active_policies' => Policy::forTenant($tenant->id)->active()->count(),
            'commission_earned' => (float) Policy::forTenant($tenant->id)->active()->sum('commission_amount'),
            'expiring_policies' => Policy::forTenant($tenant->id)->expiring(60)->count(),
            'expired_policies' => Policy::forTenant($tenant->id)->expired()->count(),
        ];

        $recentQuotes = Quote::forTenant($tenant->id)
            ->with(['customer', 'insuranceProduct'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($q) => [
                'id' => $q->id,
                'quote_number' => $q->quote_number,
                'customer' => [
                    'id' => $q->customer?->id,
                    'first_name' => $q->customer?->first_name,
                    'last_name' => $q->customer?->last_name,
                    'company_name' => $q->customer?->company_name,
                    'type' => $q->customer?->type,
                ],
                'insurance_product' => $q->insuranceProduct ? [
                    'name' => $q->insuranceProduct->name,
                    'type' => $q->insuranceProduct->type,
                ] : null,
                'status' => $q->status,
                'premium_amount' => (float) $q->premium_amount,
                'valid_until' => $q->valid_until?->toISOString(),
            ]);

        $customers = Customer::forTenant($tenant->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->display_name,
                'type' => $c->type,
                'email' => $c->email,
                'created_at' => $c->created_at->toISOString(),
            ]);

        $expiringPolicies = Policy::forTenant($tenant->id)
            ->expiring(60)
            ->with('customer')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'policy_number' => $p->policy_number,
                'customer' => [
                    'id' => $p->customer?->id,
                    'first_name' => $p->customer?->first_name,
                    'last_name' => $p->customer?->last_name,
                    'company_name' => $p->customer?->company_name,
                    'type' => $p->customer?->type,
                ],
                'expiry_date' => $p->expiry_date?->toISOString(),
                'premium_amount' => (float) $p->premium_amount,
                'status' => $p->status,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data fetched successfully',
            'data' => [
                'tenant_type' => 'broker',
                'tenant' => [
                    'name' => $tenant->name,
                    'type' => $tenant->type,
                ],
                'stats' => $stats,
                'recent_quotes' => $recentQuotes,
                'customers' => $customers,
                'expiring_policies' => $expiringPolicies,
            ],
        ]);
    }
}
