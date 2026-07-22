<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\SuperAdminRequest;
use App\Models\Customer;
use App\Models\Deployment;
use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PlatformSettingsService;
use App\Services\TenantService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SuperAdminController extends Controller
{
    public function __construct(
        private TenantService $tenantService,
        private PlatformSettingsService $platformSettings,
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
    public function suspendTenant(SuperAdminRequest $request, Tenant $tenant)
    {
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
        $settings = $this->buildSettings();

        $systemHealth = [
            'database' => $this->checkDatabaseHealth(),
            'cache' => $this->checkCacheHealth(),
            'queue' => 'healthy',
            'storage' => 'healthy',
            'email' => 'healthy',
        ];

        return Inertia::render('Admin/Settings', [
            'settings' => $settings,
            'systemHealth' => $systemHealth,
            'deployments' => Deployment::latest()->take(10)->with('user')->get(),
        ]);
    }

    /**
     * Update System Settings
     */
    public function settingsUpdate(Request $request)
    {
        $section = $request->input('section');

        $allowed = ['general', 'security', 'email', 'notifications', 'billing', 'system', 'ai', 'email_oauth'];

        if (! in_array($section, $allowed)) {
            return back()->withErrors(['section' => 'Invalid settings section.']);
        }

        $sectionData = $request->input($section);

        if (! is_array($sectionData)) {
            return back()->withErrors(['section' => 'No data found for section: '.$section]);
        }

        $this->saveSectionSettings($section, $sectionData);

        return back()->with('success', ucfirst($section).' settings saved successfully.');
    }

    private function buildSettings(): array
    {
        $keys = $this->getAllSettingKeys();
        $dbSettings = PlatformSetting::whereIn('setting_key', collect($keys)->flatten()->all())->get()->keyBy('setting_key');

        $settings = [];

        foreach ($keys as $section => $sectionKeys) {
            $settings[$section] = [];
            foreach ($sectionKeys as $key) {
                $setting = $dbSettings->get($key);
                $settings[$section][$key] = $setting
                    ? ($setting->is_encrypted ? $setting->value : $setting->setting_value)
                    : null;
            }
        }

        return $settings;
    }

    private function saveSectionSettings(string $section, array $data): void
    {
        $encryptedKeys = $this->getEncryptedKeys();

        foreach ($data as $key => $value) {
            if (isset($encryptedKeys[$key])) {
                PlatformSetting::set($key, $value, $section, true, $encryptedKeys[$key]);
            } else {
                PlatformSetting::set($key, $value, $section);
            }
        }
    }

    private function getAllSettingKeys(): array
    {
        return [
            'general' => [
                'platform_name',
                'platform_description',
                'support_email',
                'support_phone',
                'timezone',
                'date_format',
                'currency',
                'language',
                'maintenance_mode',
                'registration_enabled',
                'logo_url',
                'favicon_url',
            ],
            'security' => [
                'password_min_length',
                'password_require_symbols',
                'password_require_numbers',
                'password_require_uppercase',
                'session_timeout',
                'max_login_attempts',
                'two_factor_required',
                'api_rate_limit',
                'enable_audit_logs',
                'failed_login_lockout_duration',
            ],
            'email' => [
                'mail_driver',
                'mail_host',
                'mail_port',
                'mail_username',
                'mail_password',
                'mail_encryption',
                'mail_from_address',
                'mail_from_name',
                'mail_test_mode',
            ],
            'notifications' => [
                'welcome_emails',
                'policy_reminders',
                'payment_notifications',
                'system_alerts',
                'slack_webhook',
                'discord_webhook',
                'email_notifications',
                'sms_notifications',
                'push_notifications',
                'notification_frequency',
            ],
            'billing' => [
                'paystack_public_key',
                'paystack_secret_key',
                'paystack_webhook_secret',
                'paystack_test_mode',
                'trial_period_days',
                'grace_period_days',
                'auto_suspend_overdue',
                'invoice_prefix',
                'tax_rate',
            ],
            'system' => [
                'backup_frequency',
                'log_retention_days',
                'cache_driver',
                'queue_driver',
                'storage_driver',
                'max_upload_size',
                'enable_debug_mode',
                'maintenance_message',
                'auto_updates',
                'performance_monitoring',
            ],
            'ai' => [
                'ai_provider',
                'openai_api_key',
                'openai_base_url',
                'openai_model',
                'anthropic_api_key',
                'anthropic_base_url',
                'anthropic_model',
            ],
            'email_oauth' => [
                'gmail_client_id',
                'gmail_client_secret',
                'gmail_redirect_uri',
                'microsoft_client_id',
                'microsoft_client_secret',
                'microsoft_redirect_uri',
            ],
        ];
    }

    private function getEncryptedKeys(): array
    {
        return [
            'mail_password' => 'SMTP password for platform emails',
            'paystack_secret_key' => 'Paystack secret key',
            'openai_api_key' => 'OpenAI API key',
            'anthropic_api_key' => 'Anthropic API key',
            'gmail_client_secret' => 'Gmail OAuth client secret',
            'microsoft_client_secret' => 'Microsoft 365 OAuth client secret',
        ];
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
