<?php

use App\Http\Controllers\Settings\BillingController;
use App\Http\Controllers\Settings\NotificationSettingsController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\ThemeController;
use App\Http\Controllers\Settings\TwoFactorController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile')->name('settings.index');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('settings.profile');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('settings.password');
    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.update');

    // Two-Factor Authentication Settings
    Route::get('settings/two-factor', [TwoFactorController::class, 'show'])->name('settings.two-factor');
    Route::post('settings/two-factor', [TwoFactorController::class, 'store'])->name('two-factor.store');
    Route::post('settings/two-factor/confirm', [TwoFactorController::class, 'confirm'])->name('two-factor.confirm');
    Route::delete('settings/two-factor', [TwoFactorController::class, 'destroy'])->name('two-factor.destroy');
    Route::post('settings/two-factor/recovery-codes', [TwoFactorController::class, 'recoveryCodes'])->name('two-factor.recovery-codes');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('settings.appearance');

    // Tenant-specific settings (for non-customers) - requires tenant_id, excludes super_admin
    Route::middleware(['has.tenant'])->group(function () {
        Route::get('settings/company', [\App\Http\Controllers\Settings\CompanySettingsController::class, 'edit'])->name('settings.company');
        Route::patch('settings/company', [\App\Http\Controllers\Settings\CompanySettingsController::class, 'update'])->name('settings.company.update');

        // Billing & Subscription Management
        Route::get('settings/billing', [BillingController::class, 'index'])->name('settings.billing');
        Route::post('settings/billing/change-plan', [BillingController::class, 'changePlan'])->name('settings.billing.change-plan');
        Route::post('settings/billing/cancel', [BillingController::class, 'cancelSubscription'])->name('settings.billing.cancel');
        Route::get('settings/billing/receipt/{subscriptionId}', [BillingController::class, 'downloadReceipt'])->name('settings.billing.download-receipt');
        Route::get('settings/billing/receipt/{subscriptionId}/preview', [BillingController::class, 'previewReceipt'])->name('settings.billing.preview-receipt');

        Route::get('settings/notifications', [NotificationSettingsController::class, 'index'])->name('settings.notifications');
        Route::patch('settings/notifications', [NotificationSettingsController::class, 'update'])->name('settings.notifications.update');

        // API & Integration Settings
        Route::get('settings/api', [\App\Http\Controllers\Settings\ApiKeyController::class, 'index'])->name('settings.api');
        Route::post('settings/api/generate', [\App\Http\Controllers\Settings\ApiKeyController::class, 'generate'])->name('settings.api.generate');
        Route::patch('settings/api/paystack', [\App\Http\Controllers\Settings\ApiKeyController::class, 'updatePaystack'])->name('settings.api.paystack');

        // Certificate Settings
        Route::get('settings/certificates', [\App\Http\Controllers\Settings\CertificateSettingsController::class, 'index'])
            ->name('settings.certificates');
        Route::patch('settings/certificates', [\App\Http\Controllers\Settings\CertificateSettingsController::class, 'update'])
            ->name('settings.certificates.update');
        Route::post('settings/certificates/upload-logo', [\App\Http\Controllers\Settings\CertificateSettingsController::class, 'uploadLogo'])
            ->name('settings.certificates.upload-logo');
        Route::post('settings/certificates/upload-signature', [\App\Http\Controllers\Settings\CertificateSettingsController::class, 'uploadSignature'])
            ->name('settings.certificates.upload-signature');
        Route::delete('settings/certificates/delete-logo', [\App\Http\Controllers\Settings\CertificateSettingsController::class, 'deleteLogo'])
            ->name('settings.certificates.delete-logo');
        Route::delete('settings/certificates/delete-signature', [\App\Http\Controllers\Settings\CertificateSettingsController::class, 'deleteSignature'])
            ->name('settings.certificates.delete-signature');
        Route::post('settings/certificates/reset-defaults', [\App\Http\Controllers\Settings\CertificateSettingsController::class, 'resetToDefaults'])
            ->name('settings.certificates.reset-defaults');
        Route::post('settings/certificates/test-generation', [\App\Http\Controllers\Settings\CertificateSettingsController::class, 'testGeneration'])
            ->name('settings.certificates.test-generation');

        // Theme Settings
        Route::get('settings/theme', [ThemeController::class, 'index'])->name('settings.theme');
        Route::get('api/theme', [ThemeController::class, 'show'])->name('api.theme.show');
        Route::patch('api/theme', [ThemeController::class, 'update'])->name('api.theme.update');
        Route::post('api/theme/preset', [ThemeController::class, 'applyPreset'])->name('api.theme.preset');
        Route::post('api/theme/reset', [ThemeController::class, 'reset'])->name('api.theme.reset');
    });
});
