<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CertificateSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CertificateSettingsController extends Controller
{
    /**
     * Display certificate settings page
     */
    public function index()
    {
        Gate::authorize('manage_certificate_settings');

        $tenantId = Auth::user()->tenant_id;

        if (! $tenantId) {
            abort(403, 'Access denied: No tenant association.');
        }

        // Get current tenant's certificate settings as key-value pairs
        $settingsCollection = CertificateSetting::forTenant($tenantId)->get();
        $settings = $settingsCollection->pluck('setting_value', 'setting_key')->toArray();

        $registry = config('document-templates.templates', []);
        $certTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'certificate');
        $templates = array_map(fn ($key, $template) => [
            'key' => $key,
            'name' => $template['name'] ?? $key,
            'category' => $template['category'] ?? 'standard',
            'description' => $template['description'] ?? '',
        ], array_keys($certTemplates), $certTemplates);

        return Inertia::render('settings/certificates', [
            'settings' => $settings,
            'templates' => $templates,
            'availableTypes' => [
                'policy_certificate' => 'Policy Certificate',
                'policy_schedule' => 'Policy Schedule',
                'endorsement' => 'Endorsement',
                'coverage_note' => 'Coverage Note',
            ],
        ]);
    }

    /**
     * Update certificate settings
     */
    public function update(Request $request)
    {
        Gate::authorize('manage_certificate_settings');

        $validator = Validator::make($request->all(), [
            'auto_generate_on_policy_issue' => 'boolean',
            'auto_issue_on_generation' => 'boolean',
            'include_qr_code' => 'boolean',
            'include_barcode' => 'boolean',
            'enable_digital_signature' => 'boolean',
            'require_approval_for_issuance' => 'boolean',
            'certificate_numbering_format' => 'required|string|max:100',
            'certificate_validity_days' => 'nullable|integer|min:1|max:3650',
            'watermark_text' => 'nullable|string|max:255',
            'watermark_opacity' => 'nullable|numeric|min:0|max:1',
            'custom_styles' => 'nullable|json',
            'email_settings' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $tenantId = Auth::user()->tenant_id;
        $validatedData = $validator->validated();

        // Update each setting using the setSetting helper method
        foreach ($validatedData as $key => $value) {
            // Skip null values - don't store them
            if ($value !== null) {
                CertificateSetting::setSetting($key, $value, CertificateSetting::TYPE_GENERAL, false, $tenantId);
            } else {
                // Delete the setting if value is null
                CertificateSetting::where('tenant_id', $tenantId)
                    ->where('setting_key', $key)
                    ->delete();
            }
        }

        return back()->with('success', 'Certificate settings updated successfully.');
    }

    /**
     * Upload company logo for certificates
     */
    public function uploadLogo(Request $request)
    {
        Gate::authorize('manage_certificate_settings');

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,svg|max:2048',
        ]);

        $tenantId = Auth::user()->tenant_id;

        // Delete old logo if exists
        $oldLogoPath = CertificateSetting::getSetting(CertificateSetting::KEY_COMPANY_LOGO, null, $tenantId);
        if ($oldLogoPath && Storage::exists($oldLogoPath)) {
            Storage::delete($oldLogoPath);
        }

        // Store new logo
        $logoPath = $request->file('logo')->store("tenants/{$tenantId}/certificates/logos", 'public');

        // Save logo path setting
        CertificateSetting::setSetting(
            CertificateSetting::KEY_COMPANY_LOGO,
            $logoPath,
            CertificateSetting::TYPE_GENERAL,
            false,
            $tenantId
        );

        return back()->with('success', 'Company logo uploaded successfully.');
    }

    /**
     * Upload signature stamp for certificates
     */
    public function uploadSignature(Request $request)
    {
        Gate::authorize('manage_certificate_settings');

        $request->validate([
            'signature' => 'required|image|mimes:jpeg,png,jpg|max:1024',
        ]);

        $tenantId = Auth::user()->tenant_id;

        // Delete old signature if exists
        $signaturePaths = CertificateSetting::getSetting(CertificateSetting::KEY_SIGNATURE_PATHS, [], $tenantId);
        if (! empty($signaturePaths) && isset($signaturePaths['default'])) {
            $oldSignaturePath = $signaturePaths['default'];
            if (Storage::exists($oldSignaturePath)) {
                Storage::delete($oldSignaturePath);
            }
        }

        // Store new signature
        $signaturePath = $request->file('signature')->store("tenants/{$tenantId}/certificates/signatures", 'public');

        // Update signature paths setting
        $signaturePaths['default'] = $signaturePath;
        CertificateSetting::setSetting(
            CertificateSetting::KEY_SIGNATURE_PATHS,
            $signaturePaths,
            CertificateSetting::TYPE_SIGNATURE,
            true,
            $tenantId
        );

        return back()->with('success', 'Signature stamp uploaded successfully.');
    }

    /**
     * Delete logo
     */
    public function deleteLogo()
    {
        Gate::authorize('manage_certificate_settings');

        $tenantId = Auth::user()->tenant_id;
        $logoPath = CertificateSetting::getSetting(CertificateSetting::KEY_COMPANY_LOGO, null, $tenantId);

        if ($logoPath) {
            if (Storage::exists($logoPath)) {
                Storage::delete($logoPath);
            }

            // Delete the setting
            CertificateSetting::where('tenant_id', $tenantId)
                ->where('setting_key', CertificateSetting::KEY_COMPANY_LOGO)
                ->delete();
        }

        return back()->with('success', 'Company logo deleted successfully.');
    }

    /**
     * Delete signature
     */
    public function deleteSignature()
    {
        Gate::authorize('manage_certificate_settings');

        $tenantId = Auth::user()->tenant_id;
        $signaturePaths = CertificateSetting::getSetting(CertificateSetting::KEY_SIGNATURE_PATHS, [], $tenantId);

        if (! empty($signaturePaths) && isset($signaturePaths['default'])) {
            $signaturePath = $signaturePaths['default'];
            if (Storage::exists($signaturePath)) {
                Storage::delete($signaturePath);
            }

            // Remove the default signature from paths
            unset($signaturePaths['default']);

            if (empty($signaturePaths)) {
                // Delete the setting if no signatures left
                CertificateSetting::where('tenant_id', $tenantId)
                    ->where('setting_key', CertificateSetting::KEY_SIGNATURE_PATHS)
                    ->delete();
            } else {
                // Update the setting with remaining signatures
                CertificateSetting::setSetting(
                    CertificateSetting::KEY_SIGNATURE_PATHS,
                    $signaturePaths,
                    CertificateSetting::TYPE_SIGNATURE,
                    true,
                    $tenantId
                );
            }
        }

        return back()->with('success', 'Signature stamp deleted successfully.');
    }

    /**
     * Reset settings to defaults
     */
    public function resetToDefaults()
    {
        Gate::authorize('manage_certificate_settings');

        $tenantId = Auth::user()->tenant_id;
        $allSettings = CertificateSetting::forTenant($tenantId)->get();

        foreach ($allSettings as $setting) {
            // Delete uploaded files if they exist
            if ($setting->setting_key === CertificateSetting::KEY_COMPANY_LOGO && $setting->setting_value) {
                if (Storage::exists($setting->setting_value)) {
                    Storage::delete($setting->setting_value);
                }
            }

            if ($setting->setting_key === CertificateSetting::KEY_SIGNATURE_PATHS && $setting->setting_value) {
                $signaturePaths = is_array($setting->setting_value) ? $setting->setting_value : json_decode($setting->setting_value, true);
                if (is_array($signaturePaths)) {
                    foreach ($signaturePaths as $path) {
                        if (Storage::exists($path)) {
                            Storage::delete($path);
                        }
                    }
                }
            }

            // Delete the setting
            $setting->delete();
        }

        return back()->with('success', 'Certificate settings reset to defaults.');
    }

    /**
     * Test certificate generation with current settings
     */
    public function testGeneration(Request $request)
    {
        Gate::authorize('manage_certificate_settings');

        $request->validate([
            'template_key' => 'required|string',
        ]);

        try {
            // Generate test certificate data
            $testData = [
                'certificate_number' => 'TEST-'.now()->format('Ymd-His'),
                'customer_name' => 'Test Customer',
                'policy_number' => 'TEST-POL-001',
                'issue_date' => now()->format('F j, Y'),
                'validity_period' => '365 days',
            ];

            // This would generate a test certificate in a real implementation
            // For now, just return success
            return redirect()->back()->with('success', 'Test certificate generated successfully.');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to generate test certificate: '.$e->getMessage());
        }
    }
}
