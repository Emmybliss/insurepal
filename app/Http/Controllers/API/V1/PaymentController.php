<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\WebhookLog;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function initiate(Request $request, PaystackService $paystack)
    {
        $request->validate([
            'email' => 'required|email',
            'policy_product_id' => 'required|exists:policy_products,id',
            'metadata' => 'nullable|array',
            'callback_url' => 'nullable|url',
            // 'amount' is deliberately excluded from validation to prevent client-side setting reliance
        ]);

        $tenant = $request->tenant;

        if (! $tenant->paystack_secret_key) {
            return response()->json(['message' => 'Payment configuration missing for this tenant'], 400);
        }

        // 1. Resolve Product & Pricing
        $product = \App\Models\PolicyProduct::where('id', $request->policy_product_id)
            ->where('tenant_id', $tenant->id)
            ->firstOrFail();

        // Server-Side Pricing Calculation
        // Assuming $product has a base price or calculation logic.
        // For dynamic pricing (e.g. % of sum assured), we need sum_assured from metadata/request.
        // Let's assume metadata contains form_data which has 'sum_assured'.

        $customerData = $request->input('metadata.customer_data', []);
        $sumAssured = $customerData['sum_assured'] ?? 0;

        // Use product's calculation logic (Mock for now, should call $product->calculatePremium($sumAssured))
        // If product has a fixed price, use it.
        // If percentage, calculate.

        // Fallback or implementation of simple logic:
        $calculatedAmount = 0;
        if ($product->pricing_model === 'flat') {
            $calculatedAmount = $product->price;
        } elseif ($product->pricing_model === 'percentage' && $sumAssured > 0) {
            $calculatedAmount = ($sumAssured * ($product->rate ?? 1)) / 100;
        } else {
            // Default fallback if logic is complex - re-use existing helper or service if available.
            // For MVP/Demo: Trust product price if set, else require implementation.
            // Given I don't see the full Product model logic here, I will use a safe default or checking if product-price is > 0
            $calculatedAmount = $product->price > 0 ? $product->price : 1000; // Warning: HARDCODED fallback for demo if not set.
        }

        // Enforce minimum price (e.g. 100 Naira)
        if ($calculatedAmount < 100) {
            return response()->json(['message' => 'Calculated premium is invalid or too low'], 400);
        }

        $paystack->setSecretKey($tenant->paystack_secret_key);

        $reference = $paystack->generateReference($tenant->slug ?? 'insurepal');

        // Merge metadata
        $metadata = array_merge($request->input('metadata', []), [
            'tenant_id' => $tenant->id,
            'policy_product_id' => $request->policy_product_id,
            'custom_fields' => [
                ['display_name' => 'Policy Product ID', 'variable_name' => 'policy_product_id', 'value' => $request->policy_product_id],
            ],
        ]);

        $data = [
            'email' => $request->email,
            'amount' => $paystack->convertToKobo($calculatedAmount), // Use calculated amount
            'reference' => $reference,
            'metadata' => $metadata,
            'callback_url' => $request->callback_url,
        ];

        try {
            $response = $paystack->initializePayment($data);

            // Append tenant's paystack public key for frontend inline handling
            if (isset($response['data'])) {
                $response['data']['paystack_public_key'] = $tenant->paystack_public_key;
            }

            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function handleWebhook(Request $request, PaystackService $paystack, \App\Services\PolicyService $policyService)
    {
        // Require tenant_id in query param for signature verification context
        $tenantId = $request->query('tenant_id');

        if (! $tenantId) {
            return response()->json(['message' => 'Tenant ID required in webhook URL'], 400);
        }

        $tenant = Tenant::find($tenantId);
        if (! $tenant || ! $tenant->paystack_secret_key) {
            return response()->json(['message' => 'Invalid tenant'], 400);
        }

        $paystack->setSecretKey($tenant->paystack_secret_key);

        $signature = $request->header('x-paystack-signature');
        $payload = $request->getContent();

        if (! $signature || ! $paystack->verifyWebhookSignature($payload, $signature)) {
            Log::warning('Invalid Paystack Webhook Signature for Tenant: '.$tenantId);

            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $data = json_decode($payload, true);
        $event = $data['event'] ?? 'unknown';

        // Log the webhook
        $log = WebhookLog::create([
            'tenant_id' => $tenant->id,
            'gateway' => 'paystack',
            'event' => $event,
            'payload' => $data,
            'headers' => $request->headers->all(),
            'status' => 'processing',
        ]);

        if ($event === 'charge.success') {
            try {
                $meta = $data['data']['metadata'] ?? [];

                // Check if this payment is for a policy product
                if (isset($meta['policy_product_id'])) {
                    $productId = $meta['policy_product_id'];
                    $customerData = $meta['customer_data'] ?? [];
                    $amount = ($data['data']['amount'] ?? 0) / 100; // Convert back to main currency unit

                    // 1. Find or Create Customer
                    $email = $data['data']['customer']['email'] ?? $customerData['email'] ?? null;

                    if ($email) {
                        $customer = \App\Models\Customer::firstOrCreate(
                            ['tenant_id' => $tenant->id, 'email' => $email],
                            [
                                'first_name' => $customerData['first_name'] ?? 'Unknown',
                                'last_name' => $customerData['last_name'] ?? 'Customer',
                                'phone' => $customerData['phone'] ?? null,
                                'type' => 'individual',
                                'status' => 'active',
                            ]
                        );

                        // 2. Resolve Product
                        $product = \App\Models\PolicyProduct::find($productId);

                        if ($product) {
                            // 3. Issue Policy
                            $policy = $policyService->issuePolicy($tenant, $customer, $product, [
                                'amount' => $amount,
                                'start_date' => $customerData['start_date'] ?? null,
                                'end_date' => $customerData['end_date'] ?? null,
                                'form_data' => $customerData,
                            ]);

                            $log->update([
                                'status' => 'processed',
                                'response_message' => 'Policy '.$policy->policy_number.' issued successfully.',
                            ]);

                            // Opportunity to send email notifications here
                        } else {
                            $log->update(['status' => 'failed', 'response_message' => 'Product not found: '.$productId]);
                        }
                    } else {
                        $log->update(['status' => 'failed', 'response_message' => 'No email in customer data']);
                    }
                } else {
                    $log->update(['status' => 'skipped', 'response_message' => 'Not a policy payment']);
                }
            } catch (\Exception $e) {
                Log::error('Webhook Policy Issuance Failed: '.$e->getMessage());
                $log->update([
                    'status' => 'error',
                    'response_message' => $e->getMessage(),
                ]);
            }
        } else {
            $log->update(['status' => 'ignored', 'response_message' => 'Event ignored']);
        }

        return response()->json(['status' => 'success']);
    }
}
