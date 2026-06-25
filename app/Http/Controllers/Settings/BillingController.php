<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\PaymentReceiptService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BillingController extends Controller
{
    /**
     * Display billing and subscription settings
     */
    public function index()
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant association.');
        }

        // Get current active subscription
        $currentSubscription = Subscription::with('plan')
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->first();

        $currentPlan = $currentSubscription?->plan;

        // Fallback: If no active subscription record exists but the tenant has an assigned plan
        if (! $currentPlan && $tenant->subscription_plan_id) {
            $currentPlan = SubscriptionPlan::find($tenant->subscription_plan_id);
        }

        // Get all available plans
        $availablePlans = SubscriptionPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('price')
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'currency' => $plan->currency,
                    'billing_cycle' => $plan->billing_cycle,
                    'trial_days' => $plan->trial_days,
                    'features' => $plan->features,
                    'max_users' => $plan->max_users,
                    'max_policies' => $plan->max_policies,
                    'max_storage_gb' => $plan->max_storage_gb,
                    'is_popular' => $plan->is_popular,
                ];
            });

        // Get payment history from actual payments
        $paymentHistory = \App\Models\Payment::where('tenant_id', $tenant->id)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'description' => ($payment->metadata['plan_name'] ?? 'Plan').' Subscription',
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'status' => 'paid',
                    'created_at' => $payment->created_at->toISOString(),
                    'reference' => $payment->reference,
                ];
            });

        $plans = SubscriptionPlan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('settings/billing', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'company_name' => $tenant->company_name,
                'subscription_plan_id' => $tenant->subscription_plan_id,
                'subscription_started_at' => $tenant->subscription_started_at?->toISOString(),
                'subscription_expires_at' => $tenant->subscription_expires_at?->toISOString(),
                'paystack_subscription_code' => $tenant->paystack_subscription_code,
            ],
            'currentPlan' => $currentPlan ? [
                'id' => $currentPlan->id,
                'name' => $currentPlan->name,
                'slug' => $currentPlan->slug,
                'description' => $currentPlan->description,
                'price' => $currentPlan->price,
                'currency' => $currentPlan->currency,
                'billing_cycle' => $currentPlan->billing_cycle,
                'trial_days' => $currentPlan->trial_days,
                'features' => $currentPlan->features,
                'max_users' => $currentPlan->max_users,
                'max_policies' => $currentPlan->max_policies,
                'max_storage_gb' => $currentPlan->max_storage_gb,
                'is_popular' => $currentPlan->is_popular,
            ] : null,
            'availablePlans' => $availablePlans,
            'paymentHistory' => $paymentHistory,
            'plans' => $plans,
        ]);
    }

    /**
     * Change subscription plan
     */
    public function changePlan(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        // Forward to subscription controller to handle payment initialization
        return app(\App\Http\Controllers\SubscriptionController::class)
            ->initializeSubscription($request);
    }

    /**
     * Cancel subscription
     */
    public function cancelSubscription(Request $request)
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        // Delete old cancelled subscriptions to avoid unique constraint conflicts
        Subscription::where('tenant_id', $tenant->id)
            ->where('status', 'cancelled')
            ->delete();

        // Update active subscription to cancelled
        Subscription::where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

        // Update tenant status
        $tenant->update([
            'status' => 'suspended',
            'subscription_expires_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'Your subscription has been cancelled. You will lose access at the end of your billing period.');
    }

    /**
     * Download payment receipt
     */
    public function downloadReceipt(Request $request, PaymentReceiptService $receiptService, int $subscriptionId)
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        // Find subscription and verify it belongs to the tenant
        $subscription = Subscription::where('id', $subscriptionId)
            ->where('tenant_id', $tenant->id)
            ->with('plan')
            ->firstOrFail();

        return $receiptService->generateReceipt($subscription);
    }

    /**
     * Preview payment receipt data (JSON)
     */
    public function previewReceipt(Request $request, PaymentReceiptService $receiptService, int $subscriptionId)
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        // Find subscription and verify it belongs to the tenant
        $subscription = Subscription::where('id', $subscriptionId)
            ->where('tenant_id', $tenant->id)
            ->with('plan')
            ->firstOrFail();

        $data = $receiptService->getReceiptData($subscription);

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }
}
