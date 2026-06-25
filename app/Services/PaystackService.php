<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class PaystackService
{
    protected string $baseUrl;

    protected string $secretKey;

    public function __construct()
    {
        $this->baseUrl = 'https://api.paystack.co';
        $this->secretKey = config('services.paystack.secret_key') ?? '';
    }

    public function setSecretKey(string $key): self
    {
        $this->secretKey = $key;

        return $this;
    }

    /**
     * Initialize a payment transaction
     */
    public function initializePayment(array $data): array
    {
        $response = $this->makeRequest('POST', '/transaction/initialize', $data);

        return $response->json();
    }

    /**
     * Verify a payment transaction
     */
    public function verifyPayment(string $reference): array
    {
        $response = $this->makeRequest('GET', "/transaction/verify/{$reference}");

        return $response->json();
    }

    /**
     * Create a subscription plan
     */
    public function createPlan(array $data): array
    {
        $response = $this->makeRequest('POST', '/plan', $data);

        return $response->json();
    }

    /**
     * Create a subscription
     */
    public function createSubscription(array $data): array
    {
        $response = $this->makeRequest('POST', '/subscription', $data);

        return $response->json();
    }

    /**
     * Get subscription details
     */
    public function getSubscription(string $code): array
    {
        $response = $this->makeRequest('GET', "/subscription/{$code}");

        return $response->json();
    }

    /**
     * Cancel a subscription
     */
    public function cancelSubscription(string $code, string $token): array
    {
        $response = $this->makeRequest('POST', '/subscription/disable', [
            'code' => $code,
            'token' => $token,
        ]);

        return $response->json();
    }

    /**
     * Create a customer
     */
    public function createCustomer(array $data): array
    {
        $response = $this->makeRequest('POST', '/customer', $data);

        return $response->json();
    }

    /**
     * Get customer details
     */
    public function getCustomer(string $customerCode): array
    {
        $response = $this->makeRequest('GET', "/customer/{$customerCode}");

        return $response->json();
    }

    /**
     * List banks
     */
    public function getBanks(): array
    {
        $response = $this->makeRequest('GET', '/bank');

        return $response->json();
    }

    /**
     * Resolve account number
     */
    public function resolveAccountNumber(string $accountNumber, string $bankCode): array
    {
        $response = $this->makeRequest('GET', '/bank/resolve', [
            'account_number' => $accountNumber,
            'bank_code' => $bankCode,
        ]);

        return $response->json();
    }

    /**
     * Create a transfer recipient
     */
    public function createTransferRecipient(array $data): array
    {
        $response = $this->makeRequest('POST', '/transferrecipient', $data);

        return $response->json();
    }

    /**
     * Initiate a transfer
     */
    public function initiateTransfer(array $data): array
    {
        $response = $this->makeRequest('POST', '/transfer', $data);

        return $response->json();
    }

    /**
     * Verify transfer
     */
    public function verifyTransfer(string $reference): array
    {
        $response = $this->makeRequest('GET', "/transfer/verify/{$reference}");

        return $response->json();
    }

    /**
     * Get transaction timeline
     */
    public function getTransactionTimeline(string $idOrReference): array
    {
        $response = $this->makeRequest('GET', "/transaction/timeline/{$idOrReference}");

        return $response->json();
    }

    /**
     * Make HTTP request to Paystack API
     */
    /**
     * Make HTTP request to Paystack API
     */
    protected function makeRequest(string $method, string $endpoint, array $data = []): Response
    {
        // MOCK MODE for Testing/Dev when network is flaky or keys are test keys
        if (str_starts_with($this->secretKey, 'sk_test_mock')) {
            \Illuminate\Support\Facades\Log::info("Paystack Mock Request: $method $endpoint", $data);

            // Simulate network delay
            sleep(1);

            $mockData = ['status' => true, 'message' => 'Mock Success'];

            if (str_contains($endpoint, '/transaction/initialize')) {
                $mockData['data'] = [
                    'authorization_url' => 'https://checkout.paystack.com/mock-payment-page',
                    'access_code' => 'mock_access_code_'.time(),
                    'reference' => $data['reference'] ?? 'mock_ref_'.time(),
                ];
            } elseif (str_contains($endpoint, '/transaction/verify')) {
                $mockData['data'] = [
                    'status' => 'success',
                    'gateway_response' => 'Successful',
                    'amount' => 10000, // Dummy amount
                    'reference' => basename($endpoint),
                ];
            }

            // Return a fake Illuminate\Http\Client\Response
            // We can use Http::fake() internally but that's for tests.
            // Here we just return a response object constructed manually if needed,
            // OR we just return a class that mimics it.
            // Easier: Use Http::fake() sequence just for this call? No, that affects global state.
            // Let's create a real response using the Guzzle factory or just return a mock object wrapper?
            // Since the code expects $response->json(), we can return a simple object or array if we refactor.
            // But type hint says Response.

            // Simplest hook: Use a real Http client to hit a non-existent internal route that returns 200? No.
            // Correct way: Construct a Guzzle response and wrap it.

            $body = json_encode($mockData);
            $guzzleResponse = new \GuzzleHttp\Psr7\Response(200, ['Content-Type' => 'application/json'], $body);

            return new Response($guzzleResponse);
        }

        $url = $this->baseUrl.$endpoint;

        $options = [
            'Authorization' => 'Bearer '.$this->secretKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'timeout' => 30, // Increased timeout
        ];

        try {
            if ($method === 'GET' && ! empty($data)) {
                $url .= '?'.http_build_query($data);
                $response = Http::withHeaders($options)->get($url);
            } else {
                $response = Http::withHeaders($options)->$method($url, $data);
            }

            if (! $response->successful()) {
                throw new Exception('Paystack API request failed: '.$response->body());
            }

            return $response;

        } catch (Exception $e) {
            throw new Exception('Paystack API error: '.$e->getMessage());
        }
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $computedSignature = hash_hmac('sha512', $payload, $this->secretKey);

        return hash_equals($signature, $computedSignature);
    }

    /**
     * Generate payment reference
     */
    public function generateReference(string $prefix = 'insurepal'): string
    {
        return $prefix.'_'.time().'_'.str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Convert amount to kobo (Paystack uses kobo as base unit)
     */
    public function convertToKobo(float $amount): int
    {
        return (int) ($amount * 100);
    }

    /**
     * Convert amount from kobo to naira
     */
    public function convertFromKobo(int $amount): float
    {
        return $amount / 100;
    }
}
