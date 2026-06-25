<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    protected PaystackService $paystack;

    public function __construct(PaystackService $paystack)
    {
        $this->paystack = $paystack;
    }

    /**
     * Initialize subscription payment
     */
    public function initializeSubscription(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'tenant_id' => 'required|exists:tenants,id',
        ]);

        $tenant = Tenant::findOrFail($request->tenant_id);
        $plan = \App\Models\SubscriptionPlan::findOrFail($request->plan_id);

        $reference = $this->paystack->generateReference('sub');

        try {
            $paymentData = [
                'amount' => $this->paystack->convertToKobo($plan->price),
                'email' => $tenant->email,
                'reference' => $reference,
                'callback_url' => route('payment.callback'),
                'metadata' => [
                    'tenant_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'payment_type' => 'subscription',
                ],
                'channels' => ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
            ];

            $response = $this->paystack->initializePayment($paymentData);

            if ($response['status']) {
                // Create payment record
                Payment::create([
                    'tenant_id' => $tenant->id,
                    'reference' => $reference,
                    'amount' => $plan->price,
                    'currency' => 'NGN',
                    'type' => 'subscription',
                    'status' => 'pending',
                    'metadata' => [
                        'plan_id' => $plan->id,
                        'plan_name' => $plan->name,
                    ],
                ]);

                return response()->json([
                    'status' => true,
                    'message' => 'Payment initialized successfully',
                    'data' => [
                        'authorization_url' => $response['data']['authorization_url'],
                        'access_code' => $response['data']['access_code'],
                        'reference' => $reference,
                    ],
                ]);
            }

            return response()->json([
                'status' => false,
                'message' => $response['message'] ?? 'Payment initialization failed',
            ], 400);

        } catch (\Exception $e) {
            Log::error('Payment initialization failed: '.$e->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'Payment initialization failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Initialize setup fee payment (requires auth — user must be subscribed)
     */
    public function initializeSetupFee(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        $user = \Illuminate\Support\Facades\Auth::user();
        $tenant = $user?->tenant;

        if (! $tenant) {
            return response()->json([
                'status' => false,
                'message' => 'No tenant found. Please complete your registration.',
            ], 403);
        }

        // Ensure the user's plan matches the requested plan
        if ((int) $tenant->subscription_plan_id !== (int) $request->plan_id) {
            return response()->json([
                'status' => false,
                'message' => 'Plan mismatch. Please use your subscribed plan.',
            ], 403);
        }

        $plan = \App\Models\SubscriptionPlan::findOrFail($request->plan_id);

        if (! $plan->setup_fee || $plan->setup_fee <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'This plan has no setup fee.',
            ], 400);
        }

        $reference = 'SETUP_'.strtoupper(uniqid());

        try {
            $amountKobo = (int) ($plan->setup_fee * 100);

            $paymentData = [
                'email' => $user->email,
                'amount' => $amountKobo,
                'currency' => $plan->currency,
                'reference' => $reference,
                'callback_url' => route('payment.setup-fee.callback'),
                'metadata' => [
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                    'payment_type' => 'setup_fee',
                    'tenant_id' => $tenant->id,
                    'user_id' => $user->id,
                ],
            ];

            $response = $this->paystack->initializePayment($paymentData);

            if ($response['status']) {
                Log::info('Setup fee payment initialized', [
                    'plan' => $plan->name,
                    'email' => $user->email,
                    'reference' => $reference,
                    'amount' => $plan->setup_fee,
                ]);

                return response()->json([
                    'status' => true,
                    'authorization_url' => $response['data']['authorization_url'],
                    'reference' => $reference,
                ]);
            }

            return response()->json([
                'status' => false,
                'message' => $response['message'] ?? 'Could not initialize payment.',
            ], 400);

        } catch (\Exception $e) {
            Log::error('Setup fee payment failed: '.$e->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'Payment initialization failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Handle setup fee payment callback (redirects to company details after success)
     */
    public function setupFeeCallback(Request $request)
    {
        $reference = $request->query('reference');

        if (! $reference) {
            return redirect()->route('onboarding.choose-type')
                ->with('error', 'Invalid payment reference.');
        }

        try {
            $response = $this->paystack->verifyPayment($reference);

            if (! $response['status'] || $response['data']['status'] !== 'success') {
                return redirect()->route('onboarding.choose-type')
                    ->with('error', 'Setup fee payment verification failed. Please try again.');
            }

            $metadata = $response['data']['metadata'];
            $tenant = \App\Models\Tenant::find($metadata['tenant_id'] ?? null);

            if ($tenant) {
                $tenant->update([
                    'onboarding_steps' => array_merge($tenant->onboarding_steps ?? [], [
                        'setup_fee_paid' => true,
                    ]),
                ]);
            }

            return redirect()->route('onboarding.company-details')
                ->with('success', 'Setup fee paid! Please complete your company profile.');

        } catch (\Exception $e) {
            Log::error('Setup fee callback failed: '.$e->getMessage());

            return redirect()->route('onboarding.choose-type')
                ->with('error', 'Payment processing failed. Please contact support.');
        }
    }

    /**
     * Handle payment callback
     */
    public function callback(Request $request)
    {
        $reference = $request->query('reference');

        if (! $reference) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid payment reference');
        }

        try {
            $response = $this->paystack->verifyPayment($reference);

            if ($response['status'] && $response['data']['status'] === 'success') {
                $this->processSuccessfulPayment($response['data']);

                return redirect()->route('dashboard')
                    ->with('success', 'Payment successful! Your subscription has been activated.');
            }

            $this->processFailedPayment($reference, $response['data']['gateway_response'] ?? 'Payment failed');

            return redirect()->route('dashboard')
                ->with('error', 'Payment failed. Please try again.');

        } catch (\Exception $e) {
            Log::error('Payment callback error: '.$e->getMessage());

            return redirect()->route('dashboard')
                ->with('error', 'Payment verification failed. Please contact support.');
        }
    }

    /**
     * Handle Paystack webhook
     */
    public function webhook(Request $request)
    {
        $signature = $request->header('x-paystack-signature');
        $payload = $request->getContent();

        if (! $this->paystack->verifyWebhookSignature($payload, $signature)) {
            return response('Unauthorized', 401);
        }

        $event = json_decode($payload, true);

        try {
            match ($event['event']) {
                'charge.success' => $this->handleChargeSuccess($event['data']),
                'subscription.create' => $this->handleSubscriptionCreate($event['data']),
                'subscription.disable' => $this->handleSubscriptionDisable($event['data']),
                'invoice.create' => $this->handleInvoiceCreate($event['data']),
                'invoice.payment_failed' => $this->handleInvoicePaymentFailed($event['data']),
                default => Log::info('Unhandled webhook event: '.$event['event'])
            };

            return response('Webhook processed', 200);

        } catch (\Exception $e) {
            Log::error('Webhook processing error: '.$e->getMessage());

            return response('Webhook processing failed', 500);
        }
    }

    /**
     * Process successful payment
     */
    protected function processSuccessfulPayment(array $data): void
    {
        $payment = Payment::where('reference', $data['reference'])->first();

        if (! $payment) {
            Log::warning('Payment record not found for reference: '.$data['reference']);

            return;
        }

        $payment->update([
            'status' => 'completed',
            'paystack_reference' => $data['id'],
            'paid_at' => now(),
            'gateway_response' => $data['gateway_response'],
        ]);

        // If this is a subscription payment, create or update subscription
        if ($payment->type === 'subscription' && isset($payment->metadata['plan_id'])) {
            $this->createOrUpdateSubscription($payment);
        }
    }

    /**
     * Process failed payment
     */
    protected function processFailedPayment(string $reference, string $reason): void
    {
        $payment = Payment::where('reference', $reference)->first();

        if ($payment) {
            $payment->update([
                'status' => 'failed',
                'gateway_response' => $reason,
            ]);
        }
    }

    /**
     * Create or update subscription
     */
    protected function createOrUpdateSubscription(Payment $payment): void
    {
        $plan = \App\Models\SubscriptionPlan::find($payment->metadata['plan_id']);

        if (! $plan) {
            return;
        }

        // Calculate new expiration date based on billing cycle
        $endsAt = $plan->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth();

        $subscription = Subscription::updateOrCreate(
            ['tenant_id' => $payment->tenant_id],
            [
                'subscription_plan_id' => $plan->id,
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => $endsAt,
                'trial_ends_at' => null,
            ]
        );

        // Update tenant subscription status and crucial expiration dates
        $payment->tenant->update([
            'subscription_status' => 'active',
            'subscription_plan_id' => $plan->id,
            'subscription_expires_at' => $endsAt,
            // If we have a paystack code passed in from the initialize step/webhook, attach it here
            // 'paystack_subscription_code' => $this->paystack_code ???
        ]);

        Log::info("Subscription activated for tenant: {$payment->tenant_id}, expires at: {$endsAt}");
    }

    /**
     * Handle charge.success webhook
     */
    protected function handleChargeSuccess(array $data): void
    {
        $this->processSuccessfulPayment($data);
    }

    /**
     * Handle subscription.create webhook
     */
    protected function handleSubscriptionCreate(array $data): void
    {
        Log::info('Subscription created via webhook', $data);
        // Handle subscription creation logic here
    }

    /**
     * Handle subscription.disable webhook
     */
    protected function handleSubscriptionDisable(array $data): void
    {
        Log::info('Subscription disabled via webhook', $data);

        // Find and disable subscription
        $subscription = Subscription::where('paystack_code', $data['subscription_code'])->first();

        if ($subscription) {
            $subscription->update(['status' => 'cancelled']);

            $subscription->tenant->update([
                'subscription_status' => 'cancelled',
            ]);
        }
    }

    /**
     * Handle invoice.create webhook
     */
    protected function handleInvoiceCreate(array $data): void
    {
        Log::info('Invoice created via webhook', $data);
        // Handle invoice creation logic here
    }

    /**
     * Handle invoice.payment_failed webhook
     */
    protected function handleInvoicePaymentFailed(array $data): void
    {
        Log::info('Invoice payment failed via webhook', $data);

        // Handle payment failure logic here
        // Could notify tenant, suspend service, etc.
    }

    /**
     * Show payment history.
     * - Customers  → their own insurance receipts (receipts table)
     * - Staff/Admin → tenant SaaS subscription payments (payments table)
     */
    public function history(Request $request)
    {
        $user = Auth::user();
        $tenant = $user->tenant;

        // ── Customer: show their insurance payment receipts ──────────────
        if ($user->hasRole('customer')) {
            $customer = \App\Models\Customer::where('user_id', $user->id)->first();

            if (! $customer) {
                abort(404, 'Customer profile not found.');
            }

            $query = \App\Models\Receipt::where('tenant_id', $tenant->id)
                ->where('customer_id', $customer->id)
                ->with(['policy', 'invoice'])
                ->latest('payment_date');

            // Optional filters
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('receipt_number', 'like', "%{$search}%")
                        ->orWhere('payment_reference', 'like', "%{$search}%")
                        ->orWhereHas('policy', fn ($p) => $p->where('policy_number', 'like', "%{$search}%"));
                });
            }

            $receipts = $query->paginate(15)->withQueryString();

            $stats = [
                'total_paid' => \App\Models\Receipt::where('tenant_id', $tenant->id)
                    ->where('customer_id', $customer->id)
                    ->completed()
                    ->sum('amount_paid'),
                'total_count' => \App\Models\Receipt::where('tenant_id', $tenant->id)
                    ->where('customer_id', $customer->id)
                    ->count(),
                'pending_count' => \App\Models\Receipt::where('tenant_id', $tenant->id)
                    ->where('customer_id', $customer->id)
                    ->where('payment_status', \App\Models\Receipt::STATUS_PENDING)
                    ->count(),
            ];

            return Inertia::render('payments/CustomerHistory', [
                'receipts' => $receipts,
                'customer' => $customer,
                'stats' => $stats,
                'filters' => $request->only(['status', 'search']),
            ]);
        }

        // ── Staff / Admin: show SaaS subscription payments ───────────────
        $payments = \App\Models\Payment::where('tenant_id', $tenant->id)
            ->with(['tenant'])
            ->latest()
            ->paginate(15);

        return Inertia::render('payments/history', [
            'payments' => $payments,
        ]);
    }

    /**
     * Cancel subscription
     */
    public function cancelSubscription(Request $request)
    {
        $tenant = Auth::user()->tenant;
        $subscription = $tenant->subscription;

        if (! $subscription || $subscription->status !== 'active') {
            return back()->with('error', 'No active subscription found.');
        }

        try {
            if ($subscription->paystack_code && $subscription->paystack_token) {
                $this->paystack->cancelSubscription(
                    $subscription->paystack_code,
                    $subscription->paystack_token
                );
            }

            $subscription->update([
                'status' => 'cancelled',
                'ends_at' => now(),
            ]);

            $tenant->update([
                'subscription_status' => 'cancelled',
            ]);

            return back()->with('success', 'Subscription cancelled successfully.');

        } catch (\Exception $e) {
            Log::error('Subscription cancellation failed: '.$e->getMessage());

            return back()->with('error', 'Failed to cancel subscription. Please contact support.');
        }
    }
}
