<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use App\Models\Quote;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    /**
     * Generate a quote for a policy product.
     */
    public function quote(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Quote Request: '.json_encode($request->all()));

        $request->validate([
            'policy_product_id' => 'required|exists:policy_products,id',
            'sum_assured' => 'nullable|numeric|min:0',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            // Add dynamic field validation here if needed based on product
        ]);

        $product = $request->tenant->products()->findOrFail($request->policy_product_id);

        if (! $product->is_active) {
            return response()->json(['message' => 'Product is not active'], 400);
        }

        $sumAssured = $request->sum_assured ?? $product->min_sum_assured;

        \Illuminate\Support\Facades\Log::info("Quote Calc: Product {$product->id}, Base: {$product->base_premium}, SumAssured: {$sumAssured}");

        if (! $product->isValidSumAssured($sumAssured)) {
            \Illuminate\Support\Facades\Log::info("Quote Calc: Invalid Sum Assured. Min: {$product->min_sum_assured}, Max: {$product->max_sum_assured}");

            return response()->json(['message' => 'Invalid sum assured'], 422);
        }

        $premium = $product->calculatePremium($sumAssured, $request->input('factors', []));

        \Illuminate\Support\Facades\Log::info("Quote Calc: Resulting Premium: {$premium}");

        // Create a temporary quote record if needed, or just return calculations
        // For MVP, returning calculation

        $quoteData = [
            'product_name' => $product->name,
            'base_premium' => $premium,
            'fees' => 0, // Calculate fees if any
            'tax' => 0, // Calculate tax if any
            'total_amount' => $premium,
            'currency' => $product->currency ?? 'NGN',
            'sum_assured' => $sumAssured,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ];

        return response()->json($quoteData);
    }

    /**
     * Issue a policy.
     * Usually called after payment success.
     */
    /**
     * Issue a policy.
     * Called after payment success.
     */
    public function issue(Request $request, \App\Services\PaystackService $paystackService)
    {
        $request->validate([
            'payment_reference' => 'required|string',
            'policy_product_id' => 'required|exists:policy_products,id',
            'customer' => 'required|array',
            'customer.email' => 'required|email',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'sum_assured' => 'nullable|numeric',
        ]);

        try {
            // 1. Verify Payment
            $verification = $paystackService->verifyPayment($request->payment_reference);

            if (($verification['status'] ?? false) !== true || ($verification['data']['status'] ?? '') !== 'success') {
                return response()->json(['message' => 'Payment verification failed'], 400);
            }

            // 2. Re-validate Product and Pricing (Optional but recommended to check amount)
            $product = $request->tenant->products()->findOrFail($request->policy_product_id);
            $paidAmount = $verification['data']['amount'] / 100; // Convert kobo to currency units

            // Ideally re-calculate premium here to ensure paidAmount >= calculatedPremium
            // For MVP, we trust the successful payment for now or add a small tolerance check

            // 3. Find or Create Customer
            $customer = $request->tenant->customers()->firstOrCreate(
                ['email' => $request->customer['email']],
                [
                    'first_name' => $request->customer['first_name'] ?? 'Unknown',
                    'last_name' => $request->customer['last_name'] ?? 'User',
                    'phone' => $request->customer['phone'] ?? null,
                ]
            );

            // 4. Create Policy
            $policy = Policy::create([
                'tenant_id' => $request->tenant->id,
                'customer_id' => $customer->id,
                'policy_product_id' => $product->id,
                'policy_number' => 'POL-'.strtoupper(\Illuminate\Support\Str::random(8)).'-'.date('Y'), // Simple generator
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'sum_assured' => $request->sum_assured ?? $product->min_sum_assured,
                'premium_amount' => $paidAmount,
                'currency' => $product->currency ?? 'NGN',
                'status' => 'active',
                'meta_data' => [
                    'payment_reference' => $request->payment_reference,
                    // Store other details
                ],
            ]);

            // 5. Fire Event (Optional: Send Email, Generate PDF)
            // event(new PolicyIssued($policy));

            return response()->json([
                'status' => 'success',
                'message' => 'Policy issued successfully',
                'data' => $policy,
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Policy Issuance Error: '.$e->getMessage());

            return response()->json(['message' => 'Failed to issue policy: '.$e->getMessage()], 500);
        }
    }
}
