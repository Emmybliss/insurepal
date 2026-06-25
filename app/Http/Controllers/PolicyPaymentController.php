<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use App\Services\PolicyPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PolicyPaymentController extends Controller
{
    public function __construct(protected PolicyPaymentService $paymentService) {}

    /**
     * Initiate payment — create record and redirect to Paystack.
     */
    public function initiate(Request $request, Policy $policy)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'invoice_id' => 'nullable|exists:invoices,id',
        ]);

        $user = $request->user();
        $customer = \App\Models\Customer::query()->where('user_id', $user?->id)->first()
            ?? \App\Models\Customer::query()->where('tenant_id', $policy->tenant_id)->first();

        $invoice = $request->filled('invoice_id')
            ? \App\Models\Invoice::query()->find((int) $request->invoice_id)
            : null;

        try {
            $result = $this->paymentService->initiate(
                policy: $policy,
                customer: $customer ?? $policy->customer,
                amount: (float) $request->amount,
                email: $user->email,
                invoice: $invoice,
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'status' => true,
                    'authorization_url' => $result['authorization_url'],
                    'reference' => $result['reference'],
                ]);
            }

            return redirect()->away($result['authorization_url']);

        } catch (\Exception $e) {
            Log::error('Policy payment initiation failed: '.$e->getMessage());

            if ($request->wantsJson()) {
                return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
            }

            return back()->with('error', 'Payment could not be initialized. Please try again.');
        }
    }

    /**
     * Paystack callback — user redirected back after payment.
     */
    public function callback(Request $request)
    {
        $reference = $request->query('reference');

        if (! $reference) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid payment reference.');
        }

        try {
            $payment = $this->paymentService->verifyAndProcess($reference);

            if ($payment->isSuccessful()) {
                return redirect()->route('dashboard')
                    ->with('success', 'Payment successful! Your premium has been received.');
            }

            return redirect()->route('dashboard')
                ->with('error', 'Payment could not be confirmed. Please contact support.');

        } catch (\Exception $e) {
            Log::error('Policy payment callback error: '.$e->getMessage());

            return redirect()->route('dashboard')
                ->with('error', 'Payment verification failed. Contact support if funds were deducted.');
        }
    }

    /**
     * Webhook handler — Paystack server-to-server notification.
     */
    public function webhook(Request $request)
    {
        $signature = $request->header('x-paystack-signature');
        $payload = $request->getContent();

        $secretKey = config('services.paystack.secret_key');
        $computed = hash_hmac('sha512', $payload, $secretKey);

        if (! hash_equals($signature ?? '', $computed)) {
            return response('Unauthorized', 401);
        }

        $event = json_decode($payload, true);

        try {
            if ($event['event'] === 'charge.success') {
                $data = $event['data'];
                $metadata = $data['metadata'] ?? [];
                $payType = $metadata['payment_type'] ?? null;

                if ($payType === 'policy_premium') {
                    $this->paymentService->verifyAndProcess($data['reference']);
                }
            }

            return response('OK', 200);

        } catch (\Exception $e) {
            Log::error('Policy payment webhook error: '.$e->getMessage());

            return response('Error', 500);
        }
    }
}
