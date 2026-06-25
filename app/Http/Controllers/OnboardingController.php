<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    /**
     * Show subscription plans selection
     */
    public function selectPlan()
    {
        $plans = SubscriptionPlan::active()
            ->orderBy('sort_order')
            ->get();

        $user = Auth::user();
        $currentPlanId = $user?->tenant?->subscription_plan_id;

        return Inertia::render('Onboarding/SelectPlan', [
            'plans' => $plans,
            'currentPlanId' => $currentPlanId,
        ]);
    }

    /**
     * Show onboarding type selection (after successful subscription payment)
     */
    public function chooseOnboarding()
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        if (! $tenant || ! $tenant->subscription_plan_id) {
            return redirect()->route('onboarding.select-plan')
                ->with('error', 'Please select a subscription plan first.');
        }

        // If onboarding already completed, go to dashboard
        if ($tenant->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        $plan = SubscriptionPlan::find($tenant->subscription_plan_id);

        if (! $plan) {
            return redirect()->route('onboarding.select-plan')
                ->with('error', 'Your subscription plan could not be found.');
        }

        return Inertia::render('Onboarding/ChooseOnboarding', [
            'plan' => $plan,
        ]);
    }

    /**
     * Show company details form
     */
    public function companyDetails()
    {
        $tenant = Auth::user()->tenant;

        // If already completed, redirect to dashboard
        if ($tenant && $tenant->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding/CompanyDetails', [
            'tenant' => $tenant,
        ]);
    }

    /**
     * Save company details
     */
    public function saveCompanyDetails(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'type' => 'required|in:underwriter,broker',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'naicom_reg_number' => 'nullable|string|max:100',
            'rc_number' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'known_company_id' => 'nullable|integer',
            'known_company_source' => 'nullable|string|max:50',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant;

        if (! $tenant) {
            return redirect()->back()->with('error', 'No tenant found for this user.');
        }

        try {
            DB::beginTransaction();

            // Update tenant with company details
            $tenant->update([
                'company_name' => $validated['company_name'],
                'type' => $validated['type'],
                'address' => $validated['address'],
                'city' => $validated['city'],
                'state' => $validated['state'],
                'country' => $validated['country'],
                'phone' => $validated['phone'],
                'email' => $validated['email'],
                'naicom_reg_number' => $validated['naicom_reg_number'] ?? null,
                'rc_number' => $validated['rc_number'] ?? null,
                'website' => $validated['website'] ?? null,
                'known_company_id' => $validated['known_company_id'] ?? null,
                'known_company_source' => $validated['known_company_source'] ?? null,
                'onboarding_completed' => true,
                'onboarding_completed_at' => now(),
                'onboarding_steps' => [
                    'company_details' => true,
                    'subscription_selected' => true,
                    'payment_completed' => true,
                ],
            ]);

            DB::commit();

            return redirect()->route('dashboard')
                ->with('success', 'Welcome! Your account has been set up successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save company details. Please try again.'.$e->getMessage());

            return redirect()->back()
                ->with('error', 'Failed to save company details. Please try again.');
        }
    }

    /**
     * Show onboarding status
     */
    public function status()
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        return Inertia::render('Onboarding/Status', [
            'tenant' => $tenant,
            'onboardingSteps' => $tenant?->onboarding_steps ?? [],
        ]);
    }
}
