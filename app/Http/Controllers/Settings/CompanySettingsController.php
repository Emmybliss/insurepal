<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CompanySettingsRequest;
use App\Models\EmailAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CompanySettingsController extends Controller
{
    /**
     * Show the company settings form.
     */
    public function edit(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant association.');
        }

        $emailAccounts = EmailAccount::where('tenant_id', $tenant->id)
            ->where(function ($q) {
                $q->whereNotNull('oauth_token_encrypted')
                    ->orWhereNotNull('credentials_encrypted');
            })
            ->select(['id', 'provider', 'email', 'account_name', 'is_active', 'is_system_default', 'last_sync_at', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('settings/company', [
            'company' => $tenant->only([
                'name',
                'email',
                'phone',
                'address',
                'city',
                'state',
                'postal_code',
                'country',
                'website',
                'registration_number',
                'tax_id',
                'description',
                'naicom_reg_number',
                'rc_number',
                'slogan',
                // file paths
                'logo',
                'signature',
                'stamp',
                'header_image',
                'footer_image',
                'paystack_public_key',
                'paystack_secret_key',
            ]),
            'emailAccounts' => $emailAccounts,
            'themeColors' => $tenant->theme_settings ? [
                'primary_color' => $tenant->theme_settings['primary_color'] ?? '#3b82f6',
                'secondary_color' => $tenant->theme_settings['secondary_color'] ?? '#8b5cf6',
                'accent_color' => $tenant->theme_settings['accent_color'] ?? '#10b981',
            ] : null,
        ]);
    }

    /**
     * Update the company settings.
     */
    public function update(CompanySettingsRequest $request)
    {
        $tenant = $request->user()->tenant;

        if (! $tenant) {
            abort(403, 'Unauthorized actions.');
        }

        $validated = $request->validated();

        // Handle file uploads
        $fileFields = ['logo', 'signature', 'stamp', 'header_image', 'footer_image'];
        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                // Delete old file if exists
                if ($tenant->{$field}) {
                    Storage::disk('public')->delete($tenant->{$field});
                }

                $path = $request->file($field)->store("tenants/{$tenant->id}/company", 'public');
                $validated[$field] = $path;
            } else {
                // Remove file fields from validated array so we don't overwrite existing paths with null
                unset($validated[$field]);
            }
        }

        $tenant->update($validated);

        if (! empty($validated['primary_color'])) {
            $currentTheme = $tenant->theme_settings ?? [];
            $tenant->theme_settings = array_merge($currentTheme, [
                'primary_color' => $validated['primary_color'],
                'secondary_color' => $validated['secondary_color'],
                'accent_color' => $validated['accent_color'],
                'gradient' => [
                    'from' => $validated['primary_color'],
                    'via' => $validated['secondary_color'],
                    'to' => $validated['accent_color'],
                ],
                'sidebar_style' => $validated['sidebar_style'] ?? $currentTheme['sidebar_style'] ?? 'gradient',
                'header_style' => $currentTheme['header_style'] ?? 'solid',
                'body_style' => $currentTheme['body_style'] ?? 'gradient',
            ]);
            $tenant->save();
        }

        return redirect()->back()->with('success', 'Company settings updated successfully.');
    }

    public function destroyEmailAccount(Request $request, EmailAccount $account): RedirectResponse
    {
        $tenant = $request->user()->tenant;
        abort_unless($account->tenant_id === $tenant->id, 403);

        $account->delete();

        return redirect()->back()->with('success', 'Email account disconnected.');
    }

    public function updateEmailAccount(Request $request, EmailAccount $account): RedirectResponse
    {
        $tenant = $request->user()->tenant;
        abort_unless($account->tenant_id === $tenant->id, 403);

        $request->validate(['is_system_default' => 'boolean']);

        EmailAccount::where('tenant_id', $tenant->id)->update(['is_system_default' => false]);
        $account->update(['is_system_default' => true]);

        return redirect()->back()->with('success', 'System default email account updated.');
    }
}
