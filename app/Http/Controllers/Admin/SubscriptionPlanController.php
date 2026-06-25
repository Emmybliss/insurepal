<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionPlanController extends Controller
{
    /**
     * List all subscription plans.
     */
    public function index()
    {
        $plans = SubscriptionPlan::withTrashed()
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price' => $plan->price,
                'setup_fee' => $plan->setup_fee,
                'currency' => $plan->currency,
                'billing_cycle' => $plan->billing_cycle,
                'features' => $plan->features,
                'max_users' => $plan->max_users,
                'max_storage_gb' => $plan->max_storage_gb,
                'is_active' => $plan->is_active,
                'is_popular' => $plan->is_popular,
                'sort_order' => $plan->sort_order,
                'tenant_count' => $plan->tenants()->count(),
                'deleted_at' => $plan->deleted_at,
            ]);

        return Inertia::render('Admin/SubscriptionPlans/Index', [
            'plans' => $plans,
        ]);
    }

    /**
     * Show the edit form for a plan.
     */
    public function edit(SubscriptionPlan $subscriptionPlan)
    {
        return Inertia::render('Admin/SubscriptionPlans/Edit', [
            'plan' => $subscriptionPlan,
        ]);
    }

    /**
     * Update a subscription plan.
     */
    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'setup_fee' => 'nullable|numeric|min:0',
            'currency' => 'required|string|size:3',
            'max_users' => 'nullable|integer|min:1',
            'max_storage_gb' => 'nullable|integer|min:1',
            'features' => 'nullable|array',
            'features.*' => 'string|max:200',
            'is_active' => 'boolean',
            'is_popular' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $subscriptionPlan->update($validated);

        return redirect()
            ->route('admin.plans.index')
            ->with('success', "Plan \"{$subscriptionPlan->name}\" updated successfully.");
    }

    /**
     * Toggle a plan's active status.
     */
    public function toggleStatus(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->update(['is_active' => ! $subscriptionPlan->is_active]);

        $status = $subscriptionPlan->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Plan \"{$subscriptionPlan->name}\" {$status}.");
    }
}
