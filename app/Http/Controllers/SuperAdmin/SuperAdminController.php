<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SuperAdminController extends Controller
{
    public function __construct(
        private TenantService $tenantService
    ) {}

    /**
     * Super Admin Dashboard
     */
    public function dashboard()
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::active()->count(),
            'total_users' => User::tenantUsers()->count(),
            'total_customers' => Customer::count(),
            'underwriters' => Tenant::byType('underwriter')->count(),
            'brokers' => Tenant::byType('broker')->count(),
        ];

        $recentTenants = Tenant::with('users')
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentTenants' => $recentTenants,
        ]);
    }

    /**
     * Suspend Tenant
     */
    public function suspendTenant(Request $request, Tenant $tenant)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $this->tenantService->suspend($tenant, $request->reason);

        return back()->with('success', 'Tenant suspended successfully.');
    }

    /**
     * Reactivate Tenant
     */
    public function reactivateTenant(Tenant $tenant)
    {
        $this->tenantService->reactivate($tenant);

        return back()->with('success', 'Tenant reactivated successfully.');
    }

    /**
     * Global Analytics
     */
    public function analytics()
    {
        $totalRevenue = Payment::completed()->sum('amount');
        $monthlyRevenue = Payment::completed()
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');
        $previousMonthRevenue = Payment::completed()
            ->whereMonth('paid_at', now()->subMonth()->month)
            ->whereYear('paid_at', now()->subMonth()->year)
            ->sum('amount');
        $revenueGrowth = $previousMonthRevenue > 0
            ? round((($monthlyRevenue - $previousMonthRevenue) / $previousMonthRevenue) * 100, 1)
            : 0;

        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $newUsersThisMonth = User::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $churnRate = $totalUsers > 0
            ? round((($totalUsers - $activeUsers) / $totalUsers) * 100, 1)
            : 0;

        $activeTenants = Tenant::active()->count();
        $suspendedTenants = Tenant::where('status', 'suspended')->count();
        $totalTenants = Tenant::count();
        $conversionRate = $totalTenants > 0
            ? round(($activeTenants / $totalTenants) * 100, 1)
            : 0;

        $activePolicies = Policy::active()->count();
        $expiredPolicies = Policy::expired()->count();
        $totalPolicies = Policy::count();
        $renewalRate = $activePolicies > 0
            ? round(($activePolicies / $totalPolicies) * 100, 1)
            : 0;

        $monthlyRevenueData = Payment::completed()
            ->selectRaw("DATE_FORMAT(paid_at, '%Y-%m') as month, SUM(amount) as revenue")
            ->where('paid_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => $row->month,
                'revenue' => (float) $row->revenue,
                'growth' => 0,
            ])
            ->toArray();

        $underwriters = Tenant::byType('underwriter')->count();
        $brokers = Tenant::byType('broker')->count();

        $tenantGrowthData = Tenant::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, type, COUNT(*) as count")
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get()
            ->groupBy('month')
            ->map(function ($items, $month) {
                $underwriters = $items->where('type', 'underwriter')->sum('count');
                $brokers = $items->where('type', 'broker')->sum('count');

                return [
                    'month' => $month,
                    'underwriters' => $underwriters,
                    'brokers' => $brokers,
                ];
            })
            ->values()
            ->toArray();

        $topTenants = Tenant::withCount(['policies' => fn ($q) => $q->active()])
            ->select('tenants.*')
            ->selectSub(
                Payment::completed()
                    ->whereColumn('payments.tenant_id', 'tenants.id')
                    ->selectRaw('COALESCE(SUM(amount), 0)')
                    ->toBase(),
                'total_revenue'
            )
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(fn ($tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'type' => $tenant->type,
                'revenue' => (float) ($tenant->total_revenue ?? 0),
                'policies' => $tenant->policies_count ?? 0,
                'growth' => 0,
            ])
            ->toArray();

        $analytics = [
            'revenue' => [
                'total' => (float) $totalRevenue,
                'monthly' => (float) $monthlyRevenue,
                'growth' => $revenueGrowth,
                'trend' => $revenueGrowth >= 0 ? 'up' : 'down',
            ],
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'new' => $newUsersThisMonth,
                'churn' => $churnRate,
            ],
            'tenants' => [
                'total' => $totalTenants,
                'active' => $activeTenants,
                'suspended' => $suspendedTenants,
                'conversion' => $conversionRate,
            ],
            'policies' => [
                'total' => $totalPolicies,
                'active' => $activePolicies,
                'expired' => $expiredPolicies,
                'renewal_rate' => $renewalRate,
            ],
            'monthlyRevenue' => $monthlyRevenueData,
            'tenantGrowth' => $tenantGrowthData,
            'topTenants' => $topTenants,
        ];

        return Inertia::render('Admin/Analytics', [
            'analytics' => $analytics,
        ]);
    }

    /**
     * System Settings
     */
    public function settings()
    {
        // Get system-wide settings stored in cache/config
        $settings = \Illuminate\Support\Facades\Cache::get('platform_settings', []);

        $systemHealth = [
            'database' => $this->checkDatabaseHealth(),
            'cache' => $this->checkCacheHealth(),
            'queue' => 'healthy',
            'storage' => 'healthy',
            'email' => 'healthy',
        ];

        return Inertia::render('Admin/Settings', [
            'settings' => $settings ?: null,
            'systemHealth' => $systemHealth,
        ]);
    }

    /**
     * Update System Settings
     */
    public function settingsUpdate(Request $request)
    {
        $section = $request->input('section');

        $allowed = ['general', 'security', 'email', 'notifications', 'billing', 'system'];

        if (! in_array($section, $allowed)) {
            return back()->withErrors(['section' => 'Invalid settings section.']);
        }

        // Extract only the data for the requested section (Inertia sends the whole form)
        $sectionData = $request->input($section);

        if (! is_array($sectionData)) {
            return back()->withErrors(['section' => 'No data found for section: '.$section]);
        }

        // Merge just this section's data into the persisted settings
        $stored = \Illuminate\Support\Facades\Cache::get('platform_settings', []);
        $stored[$section] = $sectionData;
        \Illuminate\Support\Facades\Cache::put('platform_settings', $stored, now()->addYears(10));

        return back()->with('success', ucfirst($section).' settings saved successfully.');
    }

    private function checkDatabaseHealth(): string
    {
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();

            return 'healthy';
        } catch (\Exception $e) {
            return 'error';
        }
    }

    private function checkCacheHealth(): string
    {
        try {
            \Illuminate\Support\Facades\Cache::put('_health_check', true, 5);

            return \Illuminate\Support\Facades\Cache::get('_health_check') ? 'healthy' : 'warning';
        } catch (\Exception $e) {
            return 'error';
        }
    }

    /**
     * Global Reports
     */
    public function reports()
    {
        $reports = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::active()->count(),
            'total_users' => User::tenantUsers()->count(),
            'total_customers' => \App\Models\Customer::count(),
            'monthly_growth' => $this->getMonthlyGrowthData(),
            'subscription_breakdown' => $this->getSubscriptionBreakdown(),
        ];

        return Inertia::render('Admin/Reports', [
            'reports' => $reports,
        ]);
    }

    private function getMonthlyGrowthData(): array
    {
        return Tenant::selectRaw('MONTH(created_at) as month, YEAR(created_at) as year, COUNT(*) as count')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->toArray();
    }

    private function getSubscriptionBreakdown(): array
    {
        return [
            'active' => Tenant::where('status', 'active')->count(),
            'inactive' => Tenant::where('status', 'inactive')->count(),
            'suspended' => Tenant::where('status', 'suspended')->count(),
        ];
    }
}
