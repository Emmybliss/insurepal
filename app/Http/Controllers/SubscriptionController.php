<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function __construct(
        protected PaystackService $paystack
    ) {}

    /**
     * Initialize subscription payment
     */
    public function initializeSubscription(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'billing_cycle' => 'sometimes|in:monthly,annual',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant;
        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);
        $billingCycle = $validated['billing_cycle'] ?? 'monthly';

        if (! $tenant) {
            return redirect()->back()->with('error', 'No tenant found for this user.');
        }

        try {
            // Create or get Paystack customer
            $customerData = [
                'email' => $user->email,
                'first_name' => $user->name,
                'phone' => $tenant->phone ?? '',
            ];

            if (! $tenant->paystack_customer_code) {
                $customerResponse = $this->paystack->createCustomer($customerData);

                if ($customerResponse['status']) {
                    $tenant->update([
                        'paystack_customer_code' => $customerResponse['data']['customer_code'],
                    ]);
                }
            }

            // Calculate amount: annual = 10 months (2 months free), monthly = 1 month
            $monthlyKobo = (int) ($plan->price * 100);
            $amount = $billingCycle === 'annual' ? $monthlyKobo * 10 : $monthlyKobo;

            // Initialize payment for subscription
            $paymentData = [
                'email' => $user->email,
                'amount' => $amount,
                'currency' => $plan->currency,
                'reference' => 'SUB_'.strtoupper(uniqid()),
                'callback_url' => route('subscription.callback'),
                'metadata' => [
                    'plan_id' => $plan->id,
                    'tenant_id' => $tenant->id,
                    'user_id' => $user->id,
                    'billing_cycle' => $billingCycle,
                    'subscription_type' => 'new',
                ],
            ];

            $response = $this->paystack->initializePayment($paymentData);

            if ($response['status']) {
                // Store plan selection temporarily
                $tenant->update([
                    'subscription_plan_id' => $plan->id,
                ]);

                return Inertia::location($response['data']['authorization_url']);
            }

            return redirect()->back()->with('error', 'Failed to initialize payment. Please try again.');
        } catch (\Exception $e) {
            Log::error('Subscription initialization failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'plan_id' => $plan->id,
            ]);

            return redirect()->back()->with('error', 'An error occurred. Please try again.');
        }
    }

    /**
     * Handle payment callback from Paystack
     */
    public function callback(Request $request)
    {
        $reference = $request->query('reference');

        if (! $reference) {
            return redirect()->route('onboarding.select-plan')
                ->with('error', 'Invalid payment reference.');
        }

        try {
            $response = $this->paystack->verifyPayment($reference);

            if (! $response['status'] || $response['data']['status'] !== 'success') {
                return redirect()->route('onboarding.select-plan')
                    ->with('error', 'Payment verification failed. Please try again.');
            }

            $metadata = $response['data']['metadata'];
            $tenant = Tenant::find($metadata['tenant_id']);

            if (! $tenant) {
                return redirect()->route('onboarding.select-plan')
                    ->with('error', 'Tenant not found.');
            }

            DB::beginTransaction();

            $plan = $tenant->subscriptionPlan;
            $billingCycle = $metadata['billing_cycle'] ?? 'monthly';

            // Determine period end — no trial period, subscription starts immediately
            $periodEnd = $billingCycle === 'annual'
                ? now()->addYear()
                : now()->addMonth();

            // Delete old cancelled subscriptions to avoid unique constraint conflicts
            \App\Models\Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'cancelled')
                ->delete();

            // Cancel any existing active subscriptions
            \App\Models\Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

            // Create new subscription record — no trial, active immediately
            \App\Models\Subscription::create([
                'tenant_id' => $tenant->id,
                'subscription_plan_id' => $plan->id,
                'status' => 'active',
                'billing_cycle' => $billingCycle,
                'paystack_subscription_code' => $response['data']['authorization']['authorization_code'] ?? null,
                'current_period_start' => now(),
                'current_period_end' => $periodEnd,
                'trial_ends_at' => null, // No trial period
                'metadata' => [
                    'payment_reference' => $reference,
                    'payment_amount' => $response['data']['amount'] / 100,
                    'payment_currency' => $response['data']['currency'],
                    'payment_channel' => $response['data']['channel'],
                    'billing_cycle' => $billingCycle,
                    'authorization_code' => $response['data']['authorization']['authorization_code'] ?? null,
                    'card_type' => $response['data']['authorization']['card_type'] ?? null,
                    'last4' => $response['data']['authorization']['last4'] ?? null,
                    'bank' => $response['data']['authorization']['bank'] ?? null,
                ],
            ]);

            // Update tenant subscription details
            $tenant->update([
                'subscription_started_at' => now(),
                'subscription_expires_at' => $periodEnd,
                'paystack_subscription_code' => $response['data']['authorization']['authorization_code'] ?? null,
                'status' => 'active',
                'onboarding_steps' => array_merge($tenant->onboarding_steps ?? [], [
                    'subscription_selected' => true,
                    'payment_completed' => true,
                ]),
            ]);

            DB::commit();

            // Redirect to onboarding type selection (self vs guided)
            return redirect()->route('onboarding.choose-type')
                ->with('success', 'Payment successful! Please choose your onboarding type.');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Payment callback failed', [
                'error' => $e->getMessage(),
                'reference' => $reference,
            ]);

            return redirect()->route('onboarding.select-plan')
                ->with('error', 'Payment processing failed. Please contact support.');
        }
    }

    /**
     * Handle webhook from Paystack
     */
    public function webhook(Request $request)
    {
        // Verify Paystack signature
        $signature = $request->header('X-Paystack-Signature');
        $payload = $request->getContent();

        if (! $this->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        try {
            switch ($event) {
                case 'subscription.create':
                    $this->handleSubscriptionCreated($data);
                    break;

                case 'subscription.disable':
                    $this->handleSubscriptionCancelled($data);
                    break;

                case 'invoice.payment_failed':
                    $this->handlePaymentFailed($data);
                    break;

                default:
                    Log::info('Unhandled Paystack webhook event', ['event' => $event]);
            }

            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'event' => $event,
            ]);

            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    /**
     * Verify webhook signature
     */
    protected function verifyWebhookSignature(string $payload, ?string $signature): bool
    {
        $secretKey = config('services.paystack.secret_key');
        $computedSignature = hash_hmac('sha512', $payload, $secretKey);

        return hash_equals($computedSignature, $signature ?? '');
    }

    /**
     * Handle subscription created event
     */
    protected function handleSubscriptionCreated(array $data): void
    {

        $customerCode = $data['customer']['customer_code'] ?? null;

        if (! $customerCode) {
            return;
        }

        $tenant = Tenant::where('paystack_customer_code', $customerCode)->first();

        if ($tenant) {
            // Determine billing cycle from most recent active subscription
            $existingSub = \App\Models\Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->latest()
                ->first();
            $billingCycle = $existingSub?->billing_cycle ?? 'monthly';
            $periodEnd = $billingCycle === 'annual' ? now()->addYear() : now()->addMonth();

            // Update or create subscription record
            \App\Models\Subscription::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'status' => 'active',
                ],
                [
                    'subscription_plan_id' => $tenant->subscription_plan_id,
                    'billing_cycle' => $billingCycle,
                    'paystack_subscription_code' => $data['subscription_code'],
                    'current_period_start' => now(),
                    'current_period_end' => $periodEnd,
                    'trial_ends_at' => null,
                    'metadata' => array_merge($data, ['billing_cycle' => $billingCycle]),
                ]
            );

            $tenant->update([
                'paystack_subscription_code' => $data['subscription_code'],
                'subscription_started_at' => now(),
                'subscription_expires_at' => $periodEnd,
            ]);
        }
    }

    /**
     * Handle subscription cancelled event
     */
    protected function handleSubscriptionCancelled(array $data): void
    {
        $subscriptionCode = $data['subscription_code'] ?? null;

        if (! $subscriptionCode) {
            return;
        }

        $tenant = Tenant::where('paystack_subscription_code', $subscriptionCode)->first();

        if ($tenant) {
            // Update subscription record
            \App\Models\Subscription::where('tenant_id', $tenant->id)
                ->where('paystack_subscription_code', $subscriptionCode)
                ->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

            $tenant->update([
                'status' => 'suspended',
                'subscription_expires_at' => now(),
            ]);
        }
    }

    /**
     * Handle payment failed event
     */
    protected function handlePaymentFailed(array $data): void
    {
        $customerCode = $data['customer']['customer_code'] ?? null;

        if (! $customerCode) {
            return;
        }

        $tenant = Tenant::where('paystack_customer_code', $customerCode)->first();

        if ($tenant) {
            // Log payment failure, send notification, etc.
            Log::warning('Subscription payment failed', [
                'tenant_id' => $tenant->id,
                'customer_code' => $customerCode,
            ]);
        }
    }
}
