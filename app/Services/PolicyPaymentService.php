<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Policy;
use App\Models\PolicyPayment;
use App\Models\Receipt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PolicyPaymentService
{
    public function __construct(
        protected PaystackService $paystack,
    ) {}

    /**
     * Step 1 – Initiate a Paystack payment for a policy premium.
     *
     * @return array{payment: PolicyPayment, authorization_url: string}
     */
    public function initiate(
        Policy $policy,
        Customer $customer,
        float $amount,
        string $email,
        ?Invoice $invoice = null
    ): array {
        $tenant = $policy->tenant;
        $reference = PolicyPayment::generateReference('PP');

        $paymentData = [
            'email' => $email,
            'amount' => $this->paystack->convertToKobo($amount),
            'currency' => 'NGN',
            'reference' => $reference,
            'callback_url' => route('policy-payments.callback'),
            'metadata' => [
                'payment_type' => 'policy_premium',
                'policy_id' => $policy->id,
                'policy_number' => $policy->policy_number,
                'customer_id' => $customer->id,
                'tenant_id' => $tenant->id,
                'invoice_id' => $invoice?->id,
            ],
            'channels' => ['card', 'bank_transfer'],
        ];

        // Use tenant's own Paystack keys if configured, else fall back to platform keys
        if ($tenant->paystack_secret_key) {
            $this->paystack->setSecretKey($tenant->paystack_secret_key);
        }

        $response = $this->paystack->initializePayment($paymentData);

        if (! ($response['status'] ?? false)) {
            throw new \Exception($response['message'] ?? 'Paystack initialization failed');
        }

        $payment = DB::transaction(function () use (
            $policy, $customer, $invoice, $tenant, $reference, $amount
        ) {
            return PolicyPayment::create([
                'tenant_id' => $tenant->id,
                'policy_id' => $policy->id,
                'customer_id' => $customer->id,
                'invoice_id' => $invoice?->id,
                'reference' => $reference,
                'amount' => $amount,
                'currency' => 'NGN',
                'status' => PolicyPayment::STATUS_PENDING,
                'idempotency_key' => 'initiate_'.$reference,
            ]);
        });

        return [
            'payment' => $payment,
            'authorization_url' => $response['data']['authorization_url'],
            'access_code' => $response['data']['access_code'] ?? null,
            'reference' => $reference,
        ];
    }

    /**
     * Step 2 – Verify payment with Paystack and process if successful.
     * Called from callback URL or webhook.
     */
    public function verifyAndProcess(string $reference): PolicyPayment
    {
        $payment = PolicyPayment::where('reference', $reference)->firstOrFail();

        if ($payment->isSuccessful()) {
            return $payment; // Already processed
        }

        // Use tenant keys if set
        $tenant = $payment->tenant;
        if ($tenant->paystack_secret_key) {
            $this->paystack->setSecretKey($tenant->paystack_secret_key);
        }

        $response = $this->paystack->verifyPayment($reference);

        if (! ($response['status'] ?? false)) {
            throw new \Exception('Paystack verification failed');
        }

        $paystackData = $response['data'];
        $gatewayStatus = $paystackData['status'] ?? 'failed';

        DB::transaction(function () use ($payment, $paystackData, $gatewayStatus) {
            if ($gatewayStatus === 'success') {
                $payment->update([
                    'status' => PolicyPayment::STATUS_SUCCESS,
                    'paystack_reference' => $paystackData['id'] ?? null,
                    'channel' => $paystackData['channel'] ?? null,
                    'gateway_response' => $paystackData['gateway_response'] ?? 'Successful',
                    'paid_at' => now(),
                ]);

                // Trigger post-payment processing
                $this->handleSuccess($payment);
            } else {
                $payment->update([
                    'status' => PolicyPayment::STATUS_FAILED,
                    'gateway_response' => $paystackData['gateway_response'] ?? 'Failed',
                ]);
            }
        });

        return $payment->fresh();
    }

    /**
     * Post-payment success actions:
     * 1. Generate receipt
     * 2. Mark invoice paid (if linked)
     */
    protected function handleSuccess(PolicyPayment $payment): void
    {
        try {
            // Auto-generate receipt
            $this->generateReceipt($payment);
        } catch (\Exception $e) {
            Log::error("Receipt generation failed for payment #{$payment->id}: ".$e->getMessage());
        }

        try {
            // Mark linked invoice as paid
            if ($payment->invoice_id && $payment->invoice) {
                $invoice = $payment->invoice;
                $invoice->markAsPaid();
            }
        } catch (\Exception $e) {
            Log::error("Invoice mark-paid failed for payment #{$payment->id}: ".$e->getMessage());
        }
    }

    /**
     * Generate a Receipt record for a successful policy payment.
     */
    protected function generateReceipt(PolicyPayment $payment): Receipt
    {
        $policy = $payment->policy;
        $customer = $payment->customer;

        $receipt = Receipt::create([
            'tenant_id' => $payment->tenant_id,
            'customer_id' => $customer->id,
            'policy_id' => $policy->id,
            'invoice_id' => $payment->invoice_id,
            'receipt_number' => Receipt::generateReceiptNumber($payment->tenant_id),
            'payment_date' => $payment->paid_at ?? now(),
            'payment_method' => $this->mapChannel($payment->channel),
            'payment_reference' => $payment->reference,
            'amount_paid' => $payment->amount,
            'transaction_id' => $payment->paystack_reference,
            'payment_status' => Receipt::STATUS_COMPLETED,
            'currency' => $payment->currency,
            'notes' => "Online payment via Paystack — Ref: {$payment->reference}",
        ]);

        $payment->update(['receipt_generated' => true]);

        return $receipt;
    }

    /**
     * Map Paystack channel name to Receipt payment_method.
     */
    protected function mapChannel(?string $channel): string
    {
        return match ($channel) {
            'card' => Receipt::PAYMENT_METHOD_CREDIT_CARD,
            'bank_transfer' => Receipt::PAYMENT_METHOD_BANK_TRANSFER,
            'mobile_money' => Receipt::PAYMENT_METHOD_MOBILE_MONEY,
            default => Receipt::PAYMENT_METHOD_OTHER,
        };
    }

    /**
     * Get transaction history for a customer.
     */
    public function getCustomerHistory(Customer $customer, array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query = PolicyPayment::where('customer_id', $customer->id)
            ->with(['policy', 'invoice'])
            ->latest('paid_at');

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['from'])) {
            $query->where('created_at', '>=', $filters['from']);
        }
        if (isset($filters['to'])) {
            $query->where('created_at', '<=', $filters['to']);
        }

        return $query->paginate(15)->withQueryString();
    }
}
