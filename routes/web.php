<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\TenantController as AdminTenantController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\UserRoleController;
use App\Http\Controllers\Auth\TenantRegistrationController;
use App\Http\Controllers\BankReconciliationController;
use App\Http\Controllers\BrokerController;
use App\Http\Controllers\BrokerKycController;
use App\Http\Controllers\ClientBankAccountController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerKycController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PolicyClassController;
use App\Http\Controllers\PolicyController;
use App\Http\Controllers\PolicyManagementController;
use App\Http\Controllers\PolicyTypeController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\RemittanceController;
use App\Http\Controllers\RenewalController;
use App\Http\Controllers\SuperAdmin\SuperAdminController;
use App\Http\Controllers\TenantRelationshipController;
use App\Http\Controllers\V1\AIAssistantController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingPageController::class, 'landingPage'])->name('home');
Route::post('/demo-request', [LandingPageController::class, 'demoRequest'])->name('demo.request');
// Setup fee routes (auth required — user must be subscribed first)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/payment/setup-fee', [\App\Http\Controllers\PaymentController::class, 'initializeSetupFee'])->name('payment.setup-fee');
    Route::get('/payment/setup-fee/callback', [\App\Http\Controllers\PaymentController::class, 'setupFeeCallback'])->name('payment.setup-fee.callback');

    // Insurance Company Search Routes
    Route::get('/insurance-companies/search', [\App\Http\Controllers\InsuranceCompanySearchController::class, 'search'])
        ->name('insurance-companies.search');
    Route::get('/insurance-companies/search-underwriters', [\App\Http\Controllers\InsuranceCompanySearchController::class, 'searchUnderwriters'])
        ->name('insurance-companies.search-underwriters');

});

Route::get('/privacy-policy', [LandingPageController::class, 'privacyPolicy'])->name('privacy-policy');
Route::get('/terms-and-conditions', [LandingPageController::class, 'termsConditions'])->name('terms-conditions');

// Serve Widget JS alias
// Serve Widget JS alias (Versioning)
Route::get('/js/widget/v1.js', function () {
    $scriptUrl = \Illuminate\Support\Facades\Vite::asset('resources/js/widget/index.tsx');
    $isHot = is_file(public_path('hot'));

    $preamble = '';
    if ($isHot) {
        $hotFile = file_get_contents(public_path('hot'));
        $viteUrl = rtrim(trim($hotFile), '/'); // e.g., http://localhost:8000
        $preamble = <<<JS
    // Vite React Refresh Preamble
    import RefreshRuntime from "{$viteUrl}/@react-refresh";
    RefreshRuntime.injectIntoGlobalHook(window);
    window.\$RefreshReg$ = () => {};
    window.\$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
JS;
    }

    $js = <<<JS
(function() {
    // 1. Identification
    var myself = document.currentScript;
    var publicKey = myself ? myself.getAttribute('data-key') : null;
    var product = myself ? myself.getAttribute('data-product') : null;
    
    if (!publicKey) {
        console.warn('InsurePal Widget: data-key attribute missing on script tag.');
    }

    // 2. Global Configuration (Bridge to Module)
    window.InsurePalConfig = {
        publicKey: publicKey,
        product: product
    };

    // 3. Inject Module Script
    var script = document.createElement('script');
    script.type = 'module';
    script.async = true;
    
    // Inject Preamble if needed (using Data URI or creating separate script for preamble is tricky with 'module')
    // Actually, we can just inject a module script that imports preamble FIRST.
    // Let's create a blob or just execute it if we can.
    
    // Better strategy for Preamble:
    // We cannot easily inject import statements in a standard IIFE. 
    // We will inject a PRE-script tag that is type=module and contains the preamble.
    
    var preambleCode = `$preamble`;
    if (preambleCode) {
        var preScript = document.createElement('script');
        preScript.type = 'module';
        preScript.textContent = preambleCode;
        document.head.appendChild(preScript);
    }

    script.src = "$scriptUrl";
    document.head.appendChild(script);
})();
JS;

    return response($js)->header('Content-Type', 'application/javascript');
});

// Locale Routes
Route::post('/locale/{locale}', [LocaleController::class, 'setLocale'])->name('locale.set');

// Legacy Tenant Registration Routes (keep for compatibility)
Route::get('/register/tenant', [TenantRegistrationController::class, 'create'])->name('tenant.register');
Route::post('/register/tenant', [TenantRegistrationController::class, 'store']);
Route::get('/plans', [TenantRegistrationController::class, 'showPlans'])->name('subscription.plans');

// Payment Routes (public)
Route::post('/payment/initialize', [PaymentController::class, 'initializeSubscription'])
    ->name('payment.initialize');
Route::get('/payment/callback', [PaymentController::class, 'callback'])
    ->name('payment.callback');
Route::post('/payment/webhook', [PaymentController::class, 'webhook'])
    ->name('payment.webhook');

// Policy Payment Webhook (public — Paystack server-to-server)
Route::post('/policy-payments/webhook', [\App\Http\Controllers\PolicyPaymentController::class, 'webhook'])
    ->name('policy-payments.webhook');
// Policy Payment Callback (public — after redirect from Paystack)
Route::get('/policy-payments/callback', [\App\Http\Controllers\PolicyPaymentController::class, 'callback'])
    ->name('policy-payments.callback');

// Onboarding Routes (Authenticated but no onboarding check)
Route::middleware(['auth', 'verified'])->prefix('onboarding')->name('onboarding.')->group(function () {
    Route::get('/select-plan', [\App\Http\Controllers\OnboardingController::class, 'selectPlan'])->name('select-plan');
    Route::get('/choose-type', [\App\Http\Controllers\OnboardingController::class, 'chooseOnboarding'])->name('choose-type');
    Route::get('/company-details', [\App\Http\Controllers\OnboardingController::class, 'companyDetails'])->name('company-details');
    Route::post('/company-details', [\App\Http\Controllers\OnboardingController::class, 'saveCompanyDetails'])->name('save-company-details');
    Route::get('/status', [\App\Http\Controllers\OnboardingController::class, 'status'])->name('status');
});

// Subscription Routes
Route::middleware(['auth', 'verified'])->prefix('subscription')->name('subscription.')->group(function () {
    Route::post('/initialize', [\App\Http\Controllers\SubscriptionController::class, 'initializeSubscription'])->name('initialize');
    Route::get('/callback', [\App\Http\Controllers\SubscriptionController::class, 'callback'])->name('callback');
});

// Subscription Webhook (No auth required)
Route::post('/subscription/webhook', [\App\Http\Controllers\SubscriptionController::class, 'webhook'])->name('subscription.webhook');

// Super Admin Routes
Route::middleware(['auth', 'verified', 'super.admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [SuperAdminController::class, 'dashboard'])->name('dashboard');
    Route::post('/tenants/{tenant}/suspend', [SuperAdminController::class, 'suspendTenant'])->name('tenants.suspend');
    Route::post('/tenants/{tenant}/reactivate', [SuperAdminController::class, 'reactivateTenant'])->name('tenants.reactivate');
    Route::get('/analytics', [SuperAdminController::class, 'analytics'])->name('analytics');
    Route::get('/settings', [SuperAdminController::class, 'settings'])->name('settings');
    Route::post('/settings/update', [SuperAdminController::class, 'settingsUpdate'])->name('settings.update');

    // Additional Admin Routes
    Route::get('/reports', [SuperAdminController::class, 'reports'])->name('reports.index');

    // Subscription Plan Management
    Route::get('/subscription-plans', [\App\Http\Controllers\Admin\SubscriptionPlanController::class, 'index'])->name('plans.index');
    Route::get('/subscription-plans/{subscriptionPlan}/edit', [\App\Http\Controllers\Admin\SubscriptionPlanController::class, 'edit'])->name('plans.edit');
    Route::put('/subscription-plans/{subscriptionPlan}', [\App\Http\Controllers\Admin\SubscriptionPlanController::class, 'update'])->name('plans.update');
    Route::post('/subscription-plans/{subscriptionPlan}/toggle', [\App\Http\Controllers\Admin\SubscriptionPlanController::class, 'toggleStatus'])->name('plans.toggle');

    // Policy Management Routes (Super Admin Only)
    Route::resource('policy-types', PolicyTypeController::class);
    Route::post('policy-types/{policy_type}/toggle-status', [PolicyTypeController::class, 'toggleStatus'])
        ->name('policy-types.toggle-status');

    Route::resource('policy-classes', PolicyClassController::class);
    Route::post('policy-classes/{policy_class}/toggle-status', [PolicyClassController::class, 'toggleStatus'])
        ->name('policy-classes.toggle-status');
    Route::get('api/policy-types/{policy_type}/classes', [PolicyClassController::class, 'getByType'])
        ->name('api.policy-types.classes');

    Route::resource('policy-products', \App\Http\Controllers\Admin\PolicyProductController::class);
    Route::post('policy-products/{policy_product}/toggle-status', [\App\Http\Controllers\Admin\PolicyProductController::class, 'toggleStatus'])
        ->name('policy-products.toggle-status');
    Route::post('api/policy-products/calculate-premium', [\App\Http\Controllers\Admin\PolicyProductController::class, 'calculatePremium'])
        ->name('api.policy-products.calculate-premium');
    Route::get('api/policy-classes/{policy_class}/policy-products', [\App\Http\Controllers\Admin\PolicyProductController::class, 'getByClass'])
        ->name('api.policy-classes.policy-products');

    // Roles and Permissions Management (Super Admin)
    Route::resource('roles', AdminRoleController::class);
    Route::resource('permissions', PermissionController::class);

    // User Management (Full CRUD)
    Route::resource('users', AdminUserController::class);
    Route::post('users/{user}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::post('users/{user}/resend-verification', [AdminUserController::class, 'resendVerification'])->name('users.resend-verification');
    Route::post('users/{user}/force-verify-email', [AdminUserController::class, 'forceVerifyEmail'])->name('users.force-verify-email');
    Route::post('users/bulk-action', [AdminUserController::class, 'bulkAction'])->name('users.bulk-action');

    // User Role Management
    Route::resource('user-roles', UserRoleController::class)->parameters(['user-roles' => 'user']);
    Route::post('user-roles/{user}/assign-role', [UserRoleController::class, 'assignRole'])->name('user-roles.assign-role');
    Route::delete('user-roles/{user}/remove-role', [UserRoleController::class, 'removeRole'])->name('user-roles.remove-role');
    Route::post('user-roles/{user}/assign-permission', [UserRoleController::class, 'assignPermission'])->name('user-roles.assign-permission');
    Route::delete('user-roles/{user}/remove-permission', [UserRoleController::class, 'removePermission'])->name('user-roles.remove-permission');

    // Tenant Management (Full CRUD)
    Route::resource('tenants', AdminTenantController::class);
    Route::post('tenants/{tenant}/toggle-status', [AdminTenantController::class, 'toggleStatus'])->name('tenants.toggle-status');
    Route::post('tenants/{tenant}/extend-trial', [AdminTenantController::class, 'extendTrial'])->name('tenants.extend-trial');

    // Insurance Company Directory (Reference Companies)
    Route::resource('insurance-companies', \App\Http\Controllers\SuperAdmin\InsuranceCompanyController::class);
    Route::post('insurance-companies/{insuranceCompany}/toggle', [\App\Http\Controllers\SuperAdmin\InsuranceCompanyController::class, 'toggle'])->name('insurance-companies.toggle');

    // Insurance Company Branches (nested under companies)
    Route::get('insurance-companies/{insuranceCompany}/branches', [\App\Http\Controllers\SuperAdmin\InsuranceCompanyBranchController::class, 'index'])
        ->name('insurance-companies.branches.index');
    Route::post('insurance-companies/{insuranceCompany}/branches', [\App\Http\Controllers\SuperAdmin\InsuranceCompanyBranchController::class, 'store'])
        ->name('insurance-companies.branches.store');
    Route::put('insurance-companies/{insuranceCompany}/branches/{branch}', [\App\Http\Controllers\SuperAdmin\InsuranceCompanyBranchController::class, 'update'])
        ->name('insurance-companies.branches.update');
    Route::delete('insurance-companies/{insuranceCompany}/branches/{branch}', [\App\Http\Controllers\SuperAdmin\InsuranceCompanyBranchController::class, 'destroy'])
        ->name('insurance-companies.branches.destroy');
    Route::post('insurance-companies/{insuranceCompany}/branches/{branch}/toggle', [\App\Http\Controllers\SuperAdmin\InsuranceCompanyBranchController::class, 'toggle'])
        ->name('insurance-companies.branches.toggle');
    Route::post('tenants/{tenant}/reset-password', [AdminTenantController::class, 'resetPassword'])->name('tenants.reset-password');
    Route::post('tenants/bulk-action', [AdminTenantController::class, 'bulkAction'])->name('tenants.bulk-action');
    Route::get('tenants/{tenant}/receipt/{subscriptionId}', [AdminTenantController::class, 'downloadReceipt'])->name('tenants.receipt');
});

// Public route for broker slip verification (no auth needed — shared on PDFs)
Route::get('broker-slips/{brokerSlip}/verify', [\App\Http\Controllers\BrokerSlipController::class, 'verify'])
    ->name('broker-slips.verify');

// Protected Routes
Route::middleware(['auth', 'verified', 'tenant.scope', 'onboarding.completed'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Tenant-protected routes
    Route::middleware(['tenant.access'])->group(function () {
        // Customer Management
        Route::resource('customers', CustomerController::class);
        Route::post('customers/{customer}/provision-access', [CustomerController::class, 'provisionAccess'])
            ->name('customers.provision-access');
        Route::delete('customers/{customer}/revoke-access', [CustomerController::class, 'revokeAccess'])
            ->name('customers.revoke-access');
        Route::post('customers/{customer}/reset-password', [CustomerController::class, 'resetPassword'])
            ->name('customers.reset-password');
        Route::get('customers/{customer}/download/pdf', [CustomerController::class, 'downloadPdf'])
            ->name('customers.download-pdf');
        Route::get('customers/{customer}/download/excel', [CustomerController::class, 'downloadExcel'])
            ->name('customers.download-excel');

        Route::get('customers/export/excel', [CustomerController::class, 'exportExcel'])
            ->name('customers.export.excel');
        Route::get('customers/export/template', [CustomerController::class, 'exportTemplate'])
            ->name('customers.export.template');
        Route::post('customers/import/excel', [CustomerController::class, 'importExcel'])
            ->name('customers.import.excel');

        // Customer KYC (Tenant Admin)
        Route::get('customers/{customer}/kyc', [CustomerKycController::class, 'show'])
            ->name('customers.kyc.show');
        Route::post('customers/{customer}/kyc', [CustomerKycController::class, 'update'])
            ->name('customers.kyc.update');

        // Quote Management
        Route::resource('quotes', QuoteController::class);
        Route::post('quotes/{quote}/send', [QuoteController::class, 'send'])
            ->name('quotes.send');
        Route::post('quotes/{quote}/accept', [QuoteController::class, 'accept'])
            ->name('quotes.accept');
        Route::post('quotes/{quote}/reject', [QuoteController::class, 'reject'])
            ->name('quotes.reject');
        Route::post('quotes/{quote}/convert-to-policy', [QuoteController::class, 'convertToPolicy'])
            ->name('quotes.convert-to-policy');
        Route::post('quotes/{quote}/duplicate', [QuoteController::class, 'duplicate'])
            ->name('quotes.duplicate');
        Route::post('quotes/{quote}/extend-validity', [QuoteController::class, 'extendValidity'])
            ->name('quotes.extend-validity');
        Route::get('quotes-export/pdf', [QuoteController::class, 'exportPdf'])
            ->name('quotes.export-pdf');
        Route::get('api/quotes/expiring-soon', [QuoteController::class, 'expiringSoon'])
            ->name('api.quotes.expiring-soon');

        // Policy Products Management (Templates)
        Route::resource('policies', PolicyController::class);
        Route::post('policies/{policy}/renew', [PolicyController::class, 'renew'])
            ->name('policies.renew');
        Route::post('policies/{policy}/cancel', [PolicyController::class, 'cancel'])
            ->name('policies.cancel');
        Route::get('policies/{policy}/download', [PolicyController::class, 'downloadPdf'])
            ->name('policies.download');

        // Policy Management (Actual Issued Policies)
        Route::prefix('policy-management')->name('policy-management.')->group(function () {
            Route::get('/', [PolicyManagementController::class, 'index'])
                ->name('index');

            // Underwriter: Direct policy issuance
            Route::middleware('tenant.type:underwriter')->group(function () {
                Route::get('/create-direct', [PolicyManagementController::class, 'createDirect'])
                    ->name('create-direct');
                Route::post('/store-direct', [PolicyManagementController::class, 'storeDirect'])
                    ->name('store-direct');
            });

            // Broker: Record placed policy
            Route::middleware('tenant.type:broker')->group(function () {
                Route::get('/recorded', [PolicyManagementController::class, 'recordedPolicies'])
                    ->name('recorded-policies');
                Route::get('/record-placed', [PolicyManagementController::class, 'createRecordPlaced'])
                    ->name('record-placed');
                Route::post('/store-placed', [PolicyManagementController::class, 'storeRecordPlaced'])
                    ->name('store-placed');
            });

            Route::get('/{policy}', [PolicyManagementController::class, 'show'])
                ->name('show');
            Route::get('/{policy}/edit', [PolicyManagementController::class, 'edit'])
                ->name('edit');
            Route::put('/{policy}', [PolicyManagementController::class, 'update'])
                ->name('update');

            // Policy Amendment Routes
            Route::get('/{policy}/amend', [PolicyManagementController::class, 'showAmendForm'])
                ->name('amend');
            Route::post('/{policy}/amend', [PolicyManagementController::class, 'storeAmendment'])
                ->name('amend.store');
        });

        // Policy Approval Workflow (Underwriter only)
        Route::middleware('tenant.type:underwriter')->prefix('policy-approvals')->name('policy-approvals.')->group(function () {
            Route::get('/', [PolicyManagementController::class, 'approvals'])
                ->name('index');
            Route::post('/submit', [PolicyManagementController::class, 'submitForApproval'])
                ->name('submit');
            Route::post('/approve', [PolicyManagementController::class, 'approve'])
                ->name('approve');
            Route::post('/reject', [PolicyManagementController::class, 'reject'])
                ->name('reject');
            Route::post('/bulk-approve', [PolicyManagementController::class, 'bulkApprove'])
                ->name('bulk-approve');
        });

        // Policy Actions — issue/bulk-issue are underwriter-only
        Route::post('policy-management/convert-quote', [PolicyManagementController::class, 'convertQuote'])
            ->name('policy-management.convert-quote');
        Route::middleware('tenant.type:underwriter')->post('policy-management/{policy}/issue', [PolicyManagementController::class, 'issue'])
            ->name('policy-management.issue');
        Route::middleware('tenant.type:underwriter')->post('policy-management/bulk-issue', [PolicyManagementController::class, 'bulkIssue'])
            ->name('policy-management.bulk-issue');

        // Policy Amendment Management Routes — approve/activate are underwriter-only
        Route::post('policy-amendments/submit', [PolicyManagementController::class, 'submitAmendment'])
            ->name('policy-amendments.submit');
        Route::middleware('tenant.type:underwriter')->post('policy-amendments/approve', [PolicyManagementController::class, 'approveAmendment'])
            ->name('policy-amendments.approve');
        Route::middleware('tenant.type:underwriter')->post('policy-amendments/activate', [PolicyManagementController::class, 'activateAmendment'])
            ->name('policy-amendments.activate');

        // Certificate Management Routes (Underwriter only)
        Route::middleware('tenant.type:underwriter')->prefix('certificates')->name('certificates.')->group(function () {
            Route::get('/', [\App\Http\Controllers\CertificateController::class, 'index'])
                ->name('index');
            Route::get('/{certificate}', [\App\Http\Controllers\CertificateController::class, 'show'])
                ->name('show');
            Route::get('/{certificate}/download', [\App\Http\Controllers\CertificateController::class, 'download'])
                ->name('download');
            Route::get('/{certificate}/preview', [\App\Http\Controllers\CertificateController::class, 'preview'])
                ->name('preview');

            // Certificate Actions
            Route::post('/{certificate}/regenerate', [\App\Http\Controllers\CertificateController::class, 'regenerate'])
                ->name('regenerate');
            Route::post('/{certificate}/issue', [\App\Http\Controllers\CertificateController::class, 'issue'])
                ->name('issue');
            Route::post('/{certificate}/cancel', [\App\Http\Controllers\CertificateController::class, 'cancel'])
                ->name('cancel');
        });

        // Template Management (config-based Blade templates)
        Route::get('templates', [\App\Http\Controllers\TemplateController::class, 'index'])
            ->name('templates.index');
        Route::get('templates/{templateKey}', [\App\Http\Controllers\TemplateController::class, 'show'])
            ->name('templates.show');
        Route::match(['get', 'post'], 'templates/{templateKey}/preview', [\App\Http\Controllers\TemplateController::class, 'preview'])
            ->name('templates.preview');
        Route::get('templates/{templateKey}/edit', [\App\Http\Controllers\TemplateController::class, 'edit'])
            ->name('templates.edit');
        Route::put('templates/{templateKey}', [\App\Http\Controllers\TemplateController::class, 'update'])
            ->name('templates.update');
        Route::get('templates/{templateKey}/placeholders', [\App\Http\Controllers\TemplateController::class, 'placeholders'])
            ->name('templates.placeholders');
        Route::post('templates/{templateKey}/set-default', [\App\Http\Controllers\TemplateController::class, 'setDefault'])
            ->name('templates.set-default');
        Route::post('templates/{templateKey}/remove-default', [\App\Http\Controllers\TemplateController::class, 'removeDefault'])
            ->name('templates.remove-default');

        // Placements (Broker only)
        Route::middleware('tenant.type:broker')->group(function () {
            Route::resource('placements', \App\Http\Controllers\PlacementController::class);
            Route::post('placements/{placement}/submit-to-market', [\App\Http\Controllers\PlacementController::class, 'submitToMarket'])
                ->name('placements.submit-to-market');
            Route::post('placements/{placement}/convert-to-policy', [\App\Http\Controllers\PlacementController::class, 'convertToPolicy'])
                ->name('placements.convert-to-policy');

            // Markets (insurers on a placement)
            Route::resource('placements.placementMarkets', \App\Http\Controllers\MarketController::class)
                ->names([
                    'index' => 'placements.placement-markets.index',
                    'store' => 'placements.placement-markets.store',
                    'update' => 'placements.placement-markets.update',
                    'destroy' => 'placements.placement-markets.destroy',
                ]);
            Route::post('placements/{placement}/placementMarkets/{placementMarket}/respond', [\App\Http\Controllers\MarketController::class, 'respond'])
                ->name('placements.placement-markets.respond');
        });

        // Broker Slips (Broker only)
        Route::middleware('tenant.type:broker')->group(function () {
            Route::get('broker-slips/create-direct', [\App\Http\Controllers\BrokerSlipController::class, 'createDirect'])
                ->name('broker-slips.create-direct');
            Route::post('broker-slips/store-direct', [\App\Http\Controllers\BrokerSlipController::class, 'storeDirect'])
                ->name('broker-slips.store-direct');
            Route::resource('broker-slips', \App\Http\Controllers\BrokerSlipController::class);
            Route::post('broker-slips/{brokerSlip}/submit-for-review', [\App\Http\Controllers\BrokerSlipController::class, 'submitForReview'])
                ->name('broker-slips.submit-for-review');
            Route::post('broker-slips/{brokerSlip}/approve', [\App\Http\Controllers\BrokerSlipController::class, 'approve'])
                ->name('broker-slips.approve');
            Route::post('broker-slips/{brokerSlip}/issue', [\App\Http\Controllers\BrokerSlipController::class, 'issue'])
                ->name('broker-slips.issue');
            Route::post('broker-slips/{brokerSlip}/withdraw', [\App\Http\Controllers\BrokerSlipController::class, 'withdraw'])
                ->name('broker-slips.withdraw');
            Route::post('broker-slips/{brokerSlip}/create-new-version', [\App\Http\Controllers\BrokerSlipController::class, 'createNewVersion'])
                ->name('broker-slips.create-new-version');
            Route::get('broker-slips/{brokerSlip}/versions', [\App\Http\Controllers\BrokerSlipController::class, 'versions'])
                ->name('broker-slips.versions');
            Route::get('broker-slips/{brokerSlip}/download', [\App\Http\Controllers\BrokerSlipController::class, 'download'])
                ->name('broker-slips.download');
            Route::get('broker-slips/{brokerSlip}/preview', [\App\Http\Controllers\BrokerSlipController::class, 'preview'])
                ->name('broker-slips.preview');
            Route::get('broker-slips/{brokerSlip}/html-preview', [\App\Http\Controllers\BrokerSlipController::class, 'htmlPreview'])
                ->name('broker-slips.html-preview');
            Route::post('broker-slips/calculate-premiums', [\App\Http\Controllers\BrokerSlipController::class, 'calculatePremiums'])
                ->name('broker-slips.calculate-premiums');
        });

        // Clause Library
        Route::resource('clause-library', \App\Http\Controllers\ClauseLibraryController::class)
            ->names([
                'index' => 'clause-library.index',
                'store' => 'clause-library.store',
                'update' => 'clause-library.update',
                'destroy' => 'clause-library.destroy',
            ]);
        Route::patch('clause-library/{clauseLibrary}/toggle-global', [\App\Http\Controllers\ClauseLibraryController::class, 'toggleGlobal'])
            ->name('clause-library.toggle-global');
        Route::get('clause-library/by-class/{classType}', [\App\Http\Controllers\ClauseLibraryController::class, 'byClass'])
            ->name('clause-library.by-class');

        // Branding assets upload (for header/footer)
        Route::post('branding/assets', [\App\Http\Controllers\DocumentOverlayController::class, 'storeAsset'])
            ->name('branding.assets.store');
        Route::get('branding/assets', [\App\Http\Controllers\DocumentOverlayController::class, 'getAssets'])
            ->name('branding.assets.index');

        // Certificate Generation Routes (Underwriter only)
        Route::middleware('tenant.type:underwriter')->group(function () {
            Route::get('policies/{policy}/certificate-options', [\App\Http\Controllers\CertificateController::class, 'getGenerationOptions'])
                ->name('policies.certificate-options');
            Route::post('policies/{policy}/generate-certificate', [\App\Http\Controllers\CertificateController::class, 'generate'])
                ->name('certificates.generate');
            Route::post('certificates/bulk-generate', [\App\Http\Controllers\CertificateController::class, 'bulkGenerate'])
                ->name('certificates.bulk-generate');

            // Certificate Media Routes (QR Codes and Barcodes)
            Route::get('media/qrcode/{data}', [\App\Http\Controllers\CertificateMediaController::class, 'generateQrCode'])
                ->name('media.qrcode');
            Route::get('media/barcode/{data}', [\App\Http\Controllers\CertificateMediaController::class, 'generateBarcode'])
                ->name('media.barcode');
        });

        // Renewal Management
        Route::resource('renewals', RenewalController::class)->except('show');
        Route::get('renewals/{policy}', [RenewalController::class, 'show'])
            ->name('renewals.show');
        Route::post('renewals/{policy}/process', [RenewalController::class, 'processRenewal'])
            ->name('renewals.process');
        Route::post('renewals/send-reminders', [RenewalController::class, 'sendReminders'])
            ->name('renewals.send-reminders');
        Route::post('renewals/{policy}/send-notice', [RenewalController::class, 'sendNotice'])
            ->name('renewals.send-notice');
        Route::post('renewals/{policy}/send-notice-all', [RenewalController::class, 'sendNoticeToAllChannels'])
            ->name('renewals.send-notice-all');
        Route::delete('renewals/{policy}/clear-logs', [RenewalController::class, 'clearNotificationLogs'])
            ->name('renewals.clear-logs');
        Route::put('renewals/{policy}/toggle-auto-renewal', [RenewalController::class, 'toggleAutoRenewal'])
            ->name('renewals.toggle-auto-renewal');

        // Broker Management (for Underwriters only)
        Route::middleware('tenant.type:underwriter')->group(function () {
            Route::resource('brokers', BrokerController::class);
            Route::post('brokers/{broker}/toggle-status', [BrokerController::class, 'toggleStatus'])
                ->name('brokers.toggle-status');

            // Broker KYC (Underwriter View)
            Route::get('brokers/{broker}/kyc', [BrokerKycController::class, 'show'])
                ->name('brokers.kyc.show');
            Route::post('brokers/{broker}/kyc', [BrokerKycController::class, 'update'])
                ->name('brokers.kyc.update');

            // Broker Downloads
            Route::get('brokers/{broker}/download/pdf', [BrokerController::class, 'downloadPdf'])
                ->name('brokers.download-pdf');
            Route::get('brokers/{broker}/download/excel', [BrokerController::class, 'downloadExcel'])
                ->name('brokers.download-excel');
        });

        // Payment Management
        Route::get('payments/history', [PaymentController::class, 'history'])
            ->name('payments.history');
        Route::post('payments/cancel-subscription', [PaymentController::class, 'cancelSubscription'])
            ->name('payments.cancel-subscription');

        // ── Policy Payments (initiate only — pages removed) ───────────────
        Route::post('/policy-payments/pay/{policy}', [\App\Http\Controllers\PolicyPaymentController::class, 'initiate'])
            ->name('policy-payments.initiate');

        // Financial Notes Management - split into Debit and Credit resources
        // Debit notes
        Route::resource('debit-notes', \App\Http\Controllers\DebitNoteController::class)
            ->parameters(['debit-notes' => 'debitNote']);
        Route::post('debit-notes/{debitNote}/issue', [\App\Http\Controllers\DebitNoteController::class, 'issueDebitNote'])
            ->name('debit-notes.issue');
        Route::post('debit-notes/{debitNote}/mark-paid', [\App\Http\Controllers\DebitNoteController::class, 'markDebitNoteAsPaid'])
            ->name('debit-notes.mark-paid');
        Route::post('debit-notes/{debitNote}/cancel', [\App\Http\Controllers\DebitNoteController::class, 'cancelDebitNote'])
            ->name('debit-notes.cancel');
        Route::get('debit-notes/{debitNote}/template-options', [\App\Http\Controllers\DebitNoteController::class, 'getDebitNoteGenerationOptions'])
            ->name('debit-notes.template-options');
        Route::post('debit-notes/{debitNote}/generate', [\App\Http\Controllers\DebitNoteController::class, 'generateDebitNote'])
            ->name('debit-notes.generate');
        Route::post('debit-notes/{debitNote}/regenerate', [\App\Http\Controllers\DebitNoteController::class, 'regenerateDebitNote'])
            ->name('debit-notes.regenerate');
        Route::get('debit-notes/{debitNote}/preview', [\App\Http\Controllers\DebitNoteController::class, 'previewDebitNote'])
            ->name('debit-notes.preview');
        Route::get('debit-notes/{debitNote}/html-preview', [\App\Http\Controllers\DebitNoteController::class, 'htmlPreview'])
            ->name('debit-notes.html-preview');
        Route::get('debit-notes/{debitNote}/download', [\App\Http\Controllers\DebitNoteController::class, 'downloadDebitNotePdf'])
            ->name('debit-notes.download');
        Route::get('debit-notes/{debitNote}/download-pdf', [\App\Http\Controllers\DebitNoteController::class, 'downloadPdf'])
            ->name('debit-notes.download-pdf');
        Route::post('debit-notes/bulk-action', [\App\Http\Controllers\DebitNoteController::class, 'bulkAction'])
            ->name('debit-notes.bulk-action');

        // Credit notes
        Route::resource('credit-notes', \App\Http\Controllers\CreditNoteController::class)
            ->parameters(['credit-notes' => 'creditNote']);
        Route::post('credit-notes/{creditNote}/issue', [\App\Http\Controllers\CreditNoteController::class, 'issueCreditNote'])
            ->name('credit-notes.issue');
        Route::post('credit-notes/{creditNote}/mark-paid', [\App\Http\Controllers\CreditNoteController::class, 'markCreditNoteAsPaid'])
            ->name('credit-notes.mark-paid');
        Route::post('credit-notes/{creditNote}/cancel', [\App\Http\Controllers\CreditNoteController::class, 'cancelCreditNote'])
            ->name('credit-notes.cancel');
        Route::get('credit-notes/{creditNote}/template-options', [\App\Http\Controllers\CreditNoteController::class, 'getCreditNoteGenerationOptions'])
            ->name('credit-notes.template-options');
        Route::post('credit-notes/{creditNote}/generate', [\App\Http\Controllers\CreditNoteController::class, 'generateCreditNote'])
            ->name('credit-notes.generate');
        Route::post('credit-notes/{creditNote}/regenerate', [\App\Http\Controllers\CreditNoteController::class, 'regenerateCreditNote'])
            ->name('credit-notes.regenerate');
        Route::get('credit-notes/{creditNote}/preview', [\App\Http\Controllers\CreditNoteController::class, 'previewCreditNote'])
            ->name('credit-notes.preview');
        Route::get('credit-notes/{creditNote}/html-preview', [\App\Http\Controllers\CreditNoteController::class, 'htmlPreview'])
            ->name('credit-notes.html-preview');
        Route::get('credit-notes/{creditNote}/download', [\App\Http\Controllers\CreditNoteController::class, 'downloadCreditNotePdf'])
            ->name('credit-notes.download');
        Route::get('credit-notes/{creditNote}/download-pdf', [\App\Http\Controllers\CreditNoteController::class, 'downloadPdf'])
            ->name('credit-notes.download-pdf');
        Route::post('credit-notes/bulk-action', [\App\Http\Controllers\CreditNoteController::class, 'bulkAction'])
            ->name('credit-notes.bulk-action');

        // Debit/Credit Note Generation from Policy
        Route::post('/policies/{policy}/debit-note', [\App\Http\Controllers\DebitNoteController::class, 'storeFromPolicy'])->name('policies.debit-note.store');
        Route::post('/policies/{policy}/credit-note', [\App\Http\Controllers\CreditNoteController::class, 'storeFromPolicy'])->name('policies.credit-note.store');

        // One-click Note Generation + Preview
        Route::post('/policies/{policy}/quick-debit-note', [\App\Http\Controllers\PolicyManagementController::class, 'quickCreateDebitNote'])->name('policies.quick-debit-note');
        Route::post('/policies/{policy}/quick-credit-note', [\App\Http\Controllers\PolicyManagementController::class, 'quickCreateCreditNote'])->name('policies.quick-credit-note');
        Route::post('/policies/{policy}/quick-invoice', [\App\Http\Controllers\PolicyManagementController::class, 'quickCreateInvoice'])->name('policies.quick-invoice');
        Route::post('/policies/{policy}/quick-receipt', [\App\Http\Controllers\PolicyManagementController::class, 'quickCreateReceipt'])->name('policies.quick-receipt');

        // Shared API: return policies for a customer (used in create forms)
        Route::get('api/customers/{customer}/policies', [\App\Http\Controllers\DebitNoteController::class, 'getPoliciesByCustomer'])
            ->name('api.customers.policies');

        // Invoice Management
        Route::resource('invoices', \App\Http\Controllers\InvoiceController::class);
        Route::get('invoices/{invoice}/template-options', [\App\Http\Controllers\InvoiceController::class, 'getInvoiceGenerationOptions'])
            ->name('invoices.template-options');
        Route::post('invoices/{invoice}/generate', [\App\Http\Controllers\InvoiceController::class, 'generateInvoice'])
            ->name('invoices.generate');
        Route::get('invoices/{invoice}/preview', [\App\Http\Controllers\InvoiceController::class, 'previewInvoice'])
            ->name('invoices.preview');
        Route::get('invoices/{invoice}/html-preview', [\App\Http\Controllers\InvoiceController::class, 'htmlPreview'])
            ->name('invoices.html-preview');
        // invoice download
        Route::post('invoices/{invoice}/download', [\App\Http\Controllers\InvoiceController::class, 'downloadInvoicePdf'])
            ->name('invoices.download');
        Route::post('invoices/{invoice}/mark-sent', [\App\Http\Controllers\InvoiceController::class, 'markAsSent'])
            ->name('invoices.mark-sent');
        Route::post('invoices/{invoice}/mark-paid', [\App\Http\Controllers\InvoiceController::class, 'markAsPaid'])
            ->name('invoices.mark-paid');

        // Expense Management
        Route::resource('expenses', \App\Http\Controllers\ExpenseController::class);

        // Receipt Management
        Route::resource('receipts', \App\Http\Controllers\ReceiptController::class);
        Route::get('receipts/{receipt}/template-options', [\App\Http\Controllers\ReceiptController::class, 'getReceiptGenerationOptions'])
            ->name('receipts.template-options');
        Route::post('receipts/{receipt}/generate', [\App\Http\Controllers\ReceiptController::class, 'generateReceipt'])
            ->name('receipts.generate');
        Route::get('receipts/{receipt}/preview', [\App\Http\Controllers\ReceiptController::class, 'previewReceipt'])
            ->name('receipts.preview');
        Route::get('receipts/{receipt}/html-preview', [\App\Http\Controllers\ReceiptController::class, 'htmlPreview'])
            ->name('receipts.html-preview');
        Route::post('receipts/{receipt}/mark-refunded', [\App\Http\Controllers\ReceiptController::class, 'markAsRefunded'])
            ->name('receipts.mark-refunded');

        // Claims Management
        Route::resource('claims', \App\Http\Controllers\ClaimController::class);
        Route::post('claims/{claim}/submit', [\App\Http\Controllers\ClaimController::class, 'submit'])
            ->name('claims.submit');
        Route::post('claims/{claim}/start-review', [\App\Http\Controllers\ClaimController::class, 'startReview'])
            ->name('claims.start-review');
        Route::post('claims/{claim}/approve', [\App\Http\Controllers\ClaimController::class, 'approve'])
            ->name('claims.approve');
        Route::post('claims/{claim}/reject', [\App\Http\Controllers\ClaimController::class, 'reject'])
            ->name('claims.reject');
        Route::post('claims/{claim}/request-info', [\App\Http\Controllers\ClaimController::class, 'requestInfo'])
            ->name('claims.request-info');
        Route::post('claims/{claim}/settle', [\App\Http\Controllers\ClaimController::class, 'settle'])
            ->name('claims.settle');
        Route::post('claims/{claim}/close', [\App\Http\Controllers\ClaimController::class, 'close'])
            ->name('claims.close');
        Route::post('claims/{claim}/upload-documents', [\App\Http\Controllers\ClaimController::class, 'uploadDocuments'])
            ->name('claims.upload-documents');
        Route::post('claims/{claim}/add-comment', [\App\Http\Controllers\ClaimController::class, 'addComment'])
            ->name('claims.add-comment');

        // Messaging System
        Route::resource('messages', MessageController::class);
        Route::post('messages/{message}/send', [MessageController::class, 'send'])
            ->name('messages.send');
        Route::post('messages/mark-as-read', [MessageController::class, 'markAsRead'])
            ->name('messages.mark-as-read');
        Route::post('messages/mark-as-unread', [MessageController::class, 'markAsUnread'])
            ->name('messages.mark-as-unread');
        Route::post('messages/bulk-delete', [MessageController::class, 'bulkDelete'])
            ->name('messages.bulk-delete');
        Route::get('messages/{message}/attachments/{index}', [MessageController::class, 'downloadAttachment'])
            ->name('messages.download-attachment');

        // Unified Communication System (Inbox)
        Route::prefix('inbox')->name('inbox.')->group(function () {
            Route::get('create', [\App\Http\Controllers\InboxController::class, 'create'])
                ->name('create');
            Route::post('bulk-action', [\App\Http\Controllers\InboxController::class, 'bulkAction'])
                ->name('bulk-action');

            Route::post('{thread}/send', [\App\Http\Controllers\InboxController::class, 'sendDraft'])
                ->name('send');
            Route::post('{thread}/archive', [\App\Http\Controllers\InboxController::class, 'archive'])
                ->name('archive');
        });
        Route::resource('inbox', \App\Http\Controllers\InboxController::class)
            ->except(['create'])
            ->parameters([
                'inbox' => 'thread',
            ]);
        // Communication Attachments
        Route::get('attachments/{attachment}/download', [\App\Http\Controllers\CommunicationAttachmentController::class, 'download'])->name('attachments.download');

        // Support Tickets
        Route::resource('support-tickets', \App\Http\Controllers\SupportTicketController::class)->parameters(['support-tickets' => 'ticket']);
        Route::post('support-tickets/{ticket}/assign', [\App\Http\Controllers\SupportTicketController::class, 'assign'])
            ->name('support-tickets.assign');
        Route::post('support-tickets/{ticket}/status', [\App\Http\Controllers\SupportTicketController::class, 'changeStatus'])
            ->name('support-tickets.change-status');
        Route::post('support-tickets/{ticket}/resolve', [\App\Http\Controllers\SupportTicketController::class, 'resolve'])
            ->name('support-tickets.resolve');
        Route::post('support-tickets/{ticket}/close', [\App\Http\Controllers\SupportTicketController::class, 'close'])
            ->name('support-tickets.close');
        Route::post('support-tickets/{ticket}/reopen', [\App\Http\Controllers\SupportTicketController::class, 'reopen'])
            ->name('support-tickets.reopen');
        Route::post('support-tickets/{ticket}/escalate', [\App\Http\Controllers\SupportTicketController::class, 'escalate'])
            ->name('support-tickets.escalate');

        // Document Toolkit
        Route::prefix('document-toolkit')->name('document-toolkit.')->group(function () {
            Route::get('/', [\App\Http\Controllers\DocumentToolkitController::class, 'index'])->name('index');
            Route::get('/capabilities', [\App\Http\Controllers\DocumentToolkitController::class, 'capabilities'])->name('capabilities');
            Route::get('/converter', [\App\Http\Controllers\DocumentToolkitController::class, 'converter'])->name('converter');
            Route::post('/convert', [\App\Http\Controllers\DocumentToolkitController::class, 'convert'])->name('convert');

            Route::get('/merger', [\App\Http\Controllers\DocumentToolkitController::class, 'merger'])->name('merger');
            Route::post('/merge', [\App\Http\Controllers\DocumentToolkitController::class, 'merge'])->name('merge');

            Route::get('/compressor', [\App\Http\Controllers\DocumentToolkitController::class, 'compressor'])->name('compressor');
            Route::post('/compress', [\App\Http\Controllers\DocumentToolkitController::class, 'compress'])->name('compress');

            Route::get('/optimizer', [\App\Http\Controllers\DocumentToolkitController::class, 'optimizer'])->name('optimizer');
            Route::post('/optimize-image', [\App\Http\Controllers\DocumentToolkitController::class, 'optimizeImage'])->name('optimize-image');

            Route::get('/pdf-optimizer', [\App\Http\Controllers\DocumentToolkitController::class, 'pdfOptimizer'])->name('pdf-optimizer');
            Route::post('/optimize-pdf', [\App\Http\Controllers\DocumentToolkitController::class, 'optimizePdf'])->name('optimize-pdf');

            Route::get('/batch-pdf', [\App\Http\Controllers\DocumentToolkitController::class, 'batchPdf'])->name('batch-pdf');

            // --- PDF Branding / Overlays ---
            Route::prefix('branding')->name('branding.')->group(function () {
                Route::get('/', [\App\Http\Controllers\DocumentVaultController::class, 'index'])->name('index');
                Route::post('/upload', [\App\Http\Controllers\DocumentVaultController::class, 'upload'])->name('upload');
                Route::get('/{document}/editor', [\App\Http\Controllers\DocumentVaultController::class, 'show'])->name('editor');
                Route::delete('/{document}', [\App\Http\Controllers\DocumentVaultController::class, 'delete'])->name('delete');
                Route::get('/{document}/file/{type?}', [\App\Http\Controllers\DocumentVaultController::class, 'getFile'])->name('file');
                Route::get('/{document}/download', [\App\Http\Controllers\DocumentVaultController::class, 'download'])->name('download');

                // Processing
                Route::post('/{document}/process', [\App\Http\Controllers\DocumentProcessingController::class, 'generateFinalPdf'])->name('process');
                Route::put('/{document}/branding-config', [\App\Http\Controllers\DocumentProcessingController::class, 'saveBrandingConfig'])->name('config.save');

                // Overlays
                Route::post('/{document}/overlays', [\App\Http\Controllers\DocumentOverlayController::class, 'store'])->name('overlays.store');
                Route::put('/overlays/{overlay}', [\App\Http\Controllers\DocumentOverlayController::class, 'update'])->name('overlays.update');
                Route::delete('/overlays/{overlay}', [\App\Http\Controllers\DocumentOverlayController::class, 'destroy'])->name('overlays.destroy');

                // Assets
                Route::get('/assets', [\App\Http\Controllers\DocumentOverlayController::class, 'getAssets'])->name('assets');
                Route::post('/assets', [\App\Http\Controllers\DocumentOverlayController::class, 'storeAsset'])->name('assets.store');
                Route::get('/assets/{asset}/file', [\App\Http\Controllers\DocumentOverlayController::class, 'getAssetFile'])->name('asset-file');
                Route::delete('/assets/{asset}', [\App\Http\Controllers\DocumentOverlayController::class, 'deleteAsset'])->name('assets.delete');
            });
        });
    });

    // Tenant Relationships (Business Partnerships)
    Route::prefix('tenant-relationships')->name('tenant-relationships.')->group(function () {
        Route::get('/', [TenantRelationshipController::class, 'index'])->name('index');
        Route::get('/discover', [TenantRelationshipController::class, 'discover'])->name('discover');
        Route::post('/', [TenantRelationshipController::class, 'store'])->name('store');
        Route::get('/{relationship}', [TenantRelationshipController::class, 'show'])->name('show');
        Route::post('/{relationship}/accept', [TenantRelationshipController::class, 'accept'])->name('accept');
        Route::post('/{relationship}/decline', [TenantRelationshipController::class, 'decline'])->name('decline');
        Route::delete('/{relationship}', [TenantRelationshipController::class, 'destroy'])->name('destroy');
    });

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');
    Route::get('notifications/{notification}', [NotificationController::class, 'show'])
        ->name('notifications.show');
    Route::post('notifications/mark-as-read', [NotificationController::class, 'markAsRead'])
        ->name('notifications.mark-as-read');
    Route::post('notifications/mark-as-unread', [NotificationController::class, 'markAsUnread'])
        ->name('notifications.mark-as-unread');
    Route::post('notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.mark-all-as-read');
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])
        ->name('notifications.destroy');
    Route::post('notifications/bulk-delete', [NotificationController::class, 'bulkDelete'])
        ->name('notifications.bulk-delete');

    // API routes for notifications
    Route::get('api/notifications/unread-count', [NotificationController::class, 'getUnreadCount'])
        ->name('api.notifications.unread-count');
    Route::get('api/notifications/recent', [NotificationController::class, 'getRecent'])
        ->name('api.notifications.recent');

    // Staff Management (alias for user management for tenant-level)
    Route::resource('staff', \App\Http\Controllers\UserManagementController::class);
    Route::post('staff/{user}/toggle-status', [\App\Http\Controllers\UserManagementController::class, 'toggleStatus'])->name('staff.toggle-status');
    Route::post('staff/{user}/send-password-reset', [\App\Http\Controllers\UserManagementController::class, 'sendPasswordReset'])->name('staff.send-password-reset');
    Route::get('staff/{user}/edit-roles', [\App\Http\Controllers\UserManagementController::class, 'editRoles'])->name('staff.edit-roles');
    Route::post('staff/{user}/update-roles', [\App\Http\Controllers\UserManagementController::class, 'updateRoles'])->name('staff.update-roles');

    // Tenant-Level User Management
    Route::resource('user-management', \App\Http\Controllers\UserManagementController::class)->parameters(['user-management' => 'user']);
    Route::post('user-management/{user}/toggle-status', [\App\Http\Controllers\UserManagementController::class, 'toggleStatus'])->name('user-management.toggle-status');
    Route::post('user-management/{user}/send-password-reset', [\App\Http\Controllers\UserManagementController::class, 'sendPasswordReset'])->name('user-management.send-password-reset');
    Route::get('user-management/{user}/edit-roles', [\App\Http\Controllers\UserManagementController::class, 'editRoles'])->name('user-management.edit-roles');
    Route::post('user-management/{user}/update-roles', [\App\Http\Controllers\UserManagementController::class, 'updateRoles'])->name('user-management.update-roles');

    // Tenant-Level Role Management
    Route::resource('role-management', \App\Http\Controllers\RoleManagementController::class);
    Route::post('role-management/{role}/toggle-status', [\App\Http\Controllers\RoleManagementController::class, 'toggleStatus'])->name('role-management.toggle-status');

    // Tenant-Level Permission Management
    Route::resource('permission-management', \App\Http\Controllers\PermissionManagementController::class);
    Route::post('permission-management/{permission}/toggle-status', [\App\Http\Controllers\PermissionManagementController::class, 'toggleStatus'])->name('permission-management.toggle-status');

    // Reports & Analytics
    Route::get('reports', [\App\Http\Controllers\ReportsController::class, 'index'])
        ->name('reports.index');
    Route::get('reports/naicom', [\App\Http\Controllers\ReportsController::class, 'naicom'])
        ->name('reports.naicom');

    // NAICOM Forms 7.2A–7.2C
    Route::prefix('reports/naicom')->name('reports.naicom.')->group(function () {
        Route::get('/runs', [\App\Http\Controllers\NaicomReportController::class, 'index'])->name('index');
        Route::get('/runs/create', [\App\Http\Controllers\NaicomReportController::class, 'create'])->name('create');
        Route::post('/runs', [\App\Http\Controllers\NaicomReportController::class, 'store'])->name('store');
        Route::get('/runs/{reportRun}', [\App\Http\Controllers\NaicomReportController::class, 'show'])->name('show');
        Route::get('/runs/{reportRun}/form-7.2a', [\App\Http\Controllers\NaicomReportController::class, 'form72A'])->name('form-7.2a');
        Route::get('/runs/{reportRun}/form-7.2b', [\App\Http\Controllers\NaicomReportController::class, 'form72B'])->name('form-7.2b');
        Route::get('/runs/{reportRun}/form-7.2c', [\App\Http\Controllers\NaicomReportController::class, 'form72C'])->name('form-7.2c');
        Route::post('/runs/{reportRun}/validate', [\App\Http\Controllers\NaicomReportController::class, 'validateReport'])->name('validate');
        Route::post('/runs/{reportRun}/submit-review', [\App\Http\Controllers\NaicomReportController::class, 'submitForReview'])->name('submit-review');
        Route::post('/runs/{reportRun}/approve', [\App\Http\Controllers\NaicomReportController::class, 'approve'])->name('approve');
        Route::post('/runs/{reportRun}/lock', [\App\Http\Controllers\NaicomReportController::class, 'lock'])->name('lock');
        Route::post('/runs/{reportRun}/export/{format}', [\App\Http\Controllers\NaicomReportController::class, 'export'])->name('export');
        Route::post('/runs/{reportRun}/adjustments', [\App\Http\Controllers\NaicomReportController::class, 'storeAdjustment'])->name('adjustments.store');
        Route::get('/runs/{reportRun}/adjustments', [\App\Http\Controllers\NaicomReportController::class, 'adjustments'])->name('adjustments');
        Route::post('/runs/{reportRun}/restate', [\App\Http\Controllers\NaicomReportController::class, 'restate'])->name('restate');
    });

    // Clients' Account Sub-Ledger
    Route::resource('client-bank-accounts', ClientBankAccountController::class);

    Route::prefix('remittances')->name('remittances.')->group(function () {
        Route::get('/', [RemittanceController::class, 'index'])->name('index');
        Route::get('/create', [RemittanceController::class, 'create'])->name('create');
        Route::post('/', [RemittanceController::class, 'store'])->name('store');
        Route::get('/{remittance}', [RemittanceController::class, 'show'])->name('show');
        Route::post('/{remittance}/complete', [RemittanceController::class, 'complete'])->name('complete');
        Route::post('/{remittance}/reverse', [RemittanceController::class, 'reverse'])->name('reverse');
    });

    Route::prefix('bank-reconciliations')->name('bank-reconciliations.')->group(function () {
        Route::get('/', [BankReconciliationController::class, 'index'])->name('index');
        Route::get('/create', [BankReconciliationController::class, 'create'])->name('create');
        Route::post('/', [BankReconciliationController::class, 'store'])->name('store');
        Route::get('/{bankReconciliation}', [BankReconciliationController::class, 'show'])->name('show');
        Route::post('/{bankReconciliation}/match-lines', [BankReconciliationController::class, 'matchLines'])->name('match-lines');
        Route::post('/{bankReconciliation}/reconcile', [BankReconciliationController::class, 'reconcile'])->name('reconcile');
        Route::post('/{bankReconciliation}/lines/{lineId}/mark-matched', [BankReconciliationController::class, 'markMatched'])->name('lines.mark-matched');
    });

    Route::get('reports/business-overview', [\App\Http\Controllers\ReportsController::class, 'businessOverview'])
        ->name('reports.business-overview');
    Route::get('reports/customer-analytics', [\App\Http\Controllers\ReportsController::class, 'customerAnalytics'])
        ->name('reports.customer-analytics');
    Route::get('reports/product-performance', [\App\Http\Controllers\ReportsController::class, 'productPerformance'])
        ->name('reports.product-performance');
    Route::get('reports/claims-analytics', [\App\Http\Controllers\ReportsController::class, 'claimsAnalytics'])
        ->name('reports.claims-analytics');
    Route::get('reports/financial-analytics', [\App\Http\Controllers\ReportsController::class, 'financialAnalytics'])
        ->name('reports.financial-analytics');
    Route::get('reports/compliance-dashboard', [\App\Http\Controllers\ReportsController::class, 'complianceDashboard'])
        ->name('reports.compliance-dashboard');
    Route::post('reports/export', [\App\Http\Controllers\ReportsController::class, 'export'])
        ->name('reports.export');

    // AI Assistant Routes
    Route::get('ai-assistant', [AIAssistantController::class, 'index'])
        ->name('ai-assistant.index');

    // My Insurance Companies (Tenant settings)
    Route::get('settings/insurance-companies', [\App\Http\Controllers\InsuranceCompanyTenantController::class, 'index'])
        ->name('settings.insurance-companies.index');
    Route::get('settings/insurance-companies/registry', [\App\Http\Controllers\InsuranceCompanyTenantController::class, 'registry'])
        ->name('settings.insurance-companies.registry');
    Route::post('settings/insurance-companies', [\App\Http\Controllers\InsuranceCompanyTenantController::class, 'store'])
        ->name('settings.insurance-companies.store');
    Route::put('settings/insurance-companies/{pivot}', [\App\Http\Controllers\InsuranceCompanyTenantController::class, 'update'])
        ->name('settings.insurance-companies.update');
    Route::delete('settings/insurance-companies/{pivot}', [\App\Http\Controllers\InsuranceCompanyTenantController::class, 'destroy'])
        ->name('settings.insurance-companies.destroy');

    // Broker Self-KYC (Settings)
    Route::get('settings/broker-kyc', [BrokerKycController::class, 'brokerShow'])
        ->name('settings.broker-kyc.show');
    Route::post('settings/broker-kyc', [BrokerKycController::class, 'brokerUpdate'])
        ->name('settings.broker-kyc.update');

    // Push Notification Routes
    Route::post('push/subscribe', [\App\Http\Controllers\PushController::class, 'subscribe'])
        ->name('push.subscribe');
    Route::delete('push/subscribe', [\App\Http\Controllers\PushController::class, 'unsubscribe'])
        ->name('push.unsubscribe');
    Route::post('push/test', [\App\Http\Controllers\PushController::class, 'test'])
        ->name('push.test');

    // Recycle Bin Routes
    Route::get('recycle-bin', [\App\Http\Controllers\RecycleBinController::class, 'index'])
        ->name('recycle-bin.index');
    Route::post('recycle-bin/{type}/{id}/restore', [\App\Http\Controllers\RecycleBinController::class, 'restore'])
        ->name('recycle-bin.restore');
    Route::delete('recycle-bin/{type}/{id}/force-delete', [\App\Http\Controllers\RecycleBinController::class, 'forceDelete'])
        ->name('recycle-bin.force-delete');
});

// Customer Portal: KYC (for logged-in customer users)
Route::middleware(['auth', 'verified', 'tenant.scope', 'onboarding.completed'])->group(function () {
    Route::get('my-kyc', [CustomerKycController::class, 'customerShow'])
        ->name('customer.kyc.show');
    Route::post('my-kyc', [CustomerKycController::class, 'customerUpdate'])
        ->name('customer.kyc.update');
});

// Public Certificate Verification Route (No authentication required)
Route::get('verify-certificate/{certificateNumber}', [\App\Http\Controllers\CertificateController::class, 'verify'])
    ->name('certificates.verify');

// Public Document Verification Routes (No authentication required — printed on PDFs)
Route::get('verify/credit-note/{token}', [\App\Http\Controllers\VerifyDocumentController::class, 'creditNote'])
    ->name('verify.credit-note');
Route::get('verify/debit-note/{token}', [\App\Http\Controllers\VerifyDocumentController::class, 'debitNote'])
    ->name('verify.debit-note');
Route::get('verify/invoice/{token}', [\App\Http\Controllers\VerifyDocumentController::class, 'invoice'])
    ->name('verify.invoice');
Route::get('verify/receipt/{token}', [\App\Http\Controllers\VerifyDocumentController::class, 'receipt'])
    ->name('verify.receipt');

// Help & Support Center (public routes)
Route::get('help', [\App\Http\Controllers\HelpController::class, 'index'])->name('help.index');
Route::get('help/articles', [\App\Http\Controllers\KnowledgeBaseController::class, 'index'])->name('kb.index');
Route::get('help/articles/{article}', [\App\Http\Controllers\KnowledgeBaseController::class, 'show'])->name('kb.show');
Route::post('help/articles/{article}/feedback', [\App\Http\Controllers\KnowledgeBaseController::class, 'recordFeedback'])
    ->name('kb.feedback');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
