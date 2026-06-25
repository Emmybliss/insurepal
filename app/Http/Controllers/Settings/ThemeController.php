<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ThemeController extends Controller
{
    /**
     * Display the theme customization page
     */
    public function index(): Response
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'No tenant associated with this account.');
        }

        return Inertia::render('settings/theme', [
            'currentTheme' => $tenant->getTheme(),
            'themePresets' => Tenant::getThemePresets(),
        ]);
    }

    /**
     * Get current theme settings
     */
    public function show(): JsonResponse
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            return response()->json(['error' => 'No tenant associated with this account.'], 403);
        }

        return response()->json([
            'theme' => $tenant->getTheme(),
            'presets' => Tenant::getThemePresets(),
        ]);
    }

    /**
     * Update theme settings
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'primary_color' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'secondary_color' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'accent_color' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'gradient.from' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'gradient.via' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'gradient.to' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'sidebar_style' => 'required|in:solid,gradient',
            'header_style' => 'required|in:solid,gradient',
            'body_style' => 'required|in:solid,gradient,none',
        ]);

        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            return response()->json(['error' => 'No tenant associated with this account.'], 403);
        }

        $tenant->update(['theme_settings' => $validated]);

        return response()->json([
            'message' => 'Theme updated successfully',
            'theme' => $tenant->getTheme(),
        ]);
    }

    /**
     * Apply a preset theme
     */
    public function applyPreset(Request $request)
    {
        $request->validate([
            'preset' => 'required|string',
        ]);

        $presets = Tenant::getThemePresets();

        if (! isset($presets[$request->preset])) {
            return back()->withErrors(['preset' => 'Invalid theme preset']);
        }

        $preset = $presets[$request->preset];
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            return back()->withErrors(['tenant' => 'No tenant associated with this account.']);
        }

        $themeSettings = [
            'primary_color' => $preset['primary_color'],
            'secondary_color' => $preset['secondary_color'],
            'accent_color' => $preset['accent_color'],
            'gradient' => $preset['gradient'],
            'sidebar_style' => 'gradient',
            'header_style' => 'solid',
            'body_style' => 'gradient',
        ];

        $tenant->update(['theme_settings' => $themeSettings]);

        return back()->with([
            'message' => 'Theme preset applied successfully',
            'theme' => $tenant->getTheme(),
        ]);
    }

    /**
     * Reset to default theme
     */
    public function reset()
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            return back()->withErrors(['tenant' => 'No tenant associated with this account.']);
        }

        $tenant->update(['theme_settings' => null]);

        return back()->with([
            'message' => 'Theme reset to default',
            'theme' => $tenant->getTheme(),
        ]);
    }
}
