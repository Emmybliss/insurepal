<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
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
                'smtp_settings',
                'paystack_public_key',
                'paystack_secret_key',
            ]),
        ]);
    }

    /**
     * Update the company settings.
     */
    public function update(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (! $tenant) {
            abort(403, 'Unauthorized actions.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'registration_number' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'naicom_reg_number' => 'nullable|string|max:255',
            'rc_number' => 'nullable|string|max:255',
            'slogan' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
            'signature' => 'nullable|image|max:1024',
            'stamp' => 'nullable|image|max:1024',
            'header_image' => 'nullable|image|max:2048',
            'footer_image' => 'nullable|image|max:2048',
            'smtp_settings' => 'nullable|array',
            'smtp_settings.use_custom' => 'nullable|boolean',
            'smtp_settings.host' => 'nullable|string|required_if:smtp_settings.use_custom,true',
            'smtp_settings.port' => 'nullable|numeric|required_if:smtp_settings.use_custom,true',
            'smtp_settings.username' => 'nullable|string|required_if:smtp_settings.use_custom,true',
            'smtp_settings.password' => 'nullable|string',
            'smtp_settings.encryption' => 'nullable|string|in:tls,ssl,starttls',
            'paystack_public_key' => 'nullable|string|max:255',
            'paystack_secret_key' => 'nullable|string|max:255',
        ]);

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

        return redirect()->back()->with('success', 'Company settings updated successfully.');
    }
}
