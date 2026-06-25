<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ApiKeyController extends Controller
{
    public function index(Request $request)
    {
        $tenant = auth()->user()->tenant;

        $keys = $tenant->apiKeys()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($key) {
                return [
                    'id' => $key->id,
                    'name' => $key->name,
                    'public_key' => $key->public_key,
                    'last_4_chars' => $key->last_4_chars,
                    'created_at' => $key->created_at,
                    'last_used_at' => $key->last_used_at,
                    'scopes' => $key->scopes,
                ];
            });

        return Inertia::render('settings/api', [
            'api_keys' => $keys,
            'paystack_config' => [
                'paystack_public_key' => $tenant->paystack_public_key,
                'paystack_secret_key' => $tenant->paystack_secret_key ? '****************'.substr($tenant->paystack_secret_key, -4) : '',
                'paystack_webhook_secret' => $tenant->paystack_webhook_secret ? '****************'.substr($tenant->paystack_webhook_secret, -4) : '',
            ],
        ]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'scopes' => 'nullable|array',
            'allowed_domains' => 'nullable|string', // Comma separated list from UI
        ]);

        $tenant = auth()->user()->tenant;

        $rawKey = 'sk_'.Str::random(48);
        $publicKey = 'pk_'.Str::random(48);

        // Parse domains
        $domains = $request->allowed_domains
            ? array_map('trim', explode(',', $request->allowed_domains))
            : [];

        $apiKey = $tenant->apiKeys()->create([
            'name' => $request->name,
            'token' => Crypt::encryptString($rawKey), // Store encrypted
            'token_hash' => hash('sha256', $rawKey), // Store hash for lookup
            'public_key' => $publicKey,
            'last_4_chars' => substr($rawKey, -4),
            'scopes' => $request->scopes ?? ['*'],
            'allowed_domains' => $domains,
            'is_active' => true,
        ]);

        return back()->with('flash', [
            'banner' => 'New API Key generated successfully. Key: '.$rawKey.' (Store it safely, it won\'t be shown again!)',
            'bannerStyle' => 'success',
            'new_key_value' => $rawKey, // Send back only one time
        ]);
    }

    public function destroy($id)
    {
        $tenant = auth()->user()->tenant;
        $key = $tenant->apiKeys()->findOrFail($id);
        $key->delete();

        return back()->with('flash', [
            'banner' => 'API Key revoked successfully.',
            'bannerStyle' => 'success',
        ]);
    }

    public function updatePaystack(Request $request)
    {
        $validated = $request->validate([
            'paystack_public_key' => 'nullable|string|max:255',
            'paystack_secret_key' => 'nullable|string|max:255',
            'paystack_webhook_secret' => 'nullable|string|max:255',
        ]);

        auth()->user()->tenant->update($validated);

        return back()->with('flash', [
            'banner' => 'Paystack configuration updated successfully.',
            'bannerStyle' => 'success',
        ]);
    }
}
