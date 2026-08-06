<?php

namespace App\Services\AI;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIGatewayService
{
    private array $providers;

    public function __construct(
        private ConversationManager $conversationManager,
    ) {
        $this->providers = config('ai.gateway.providers', []);
    }

    public function chat(
        string $message,
        Conversation $conversation,
        User $user,
        array $options = [],
    ): array {
        $provider = $this->selectProvider();
        $messages = $this->conversationManager->buildMessages($conversation, $message);
        $systemPrompt = $this->buildSystemPrompt($user);

        try {
            $response = match ($provider) {
                'gemini' => $this->callGemini($messages, $systemPrompt, $options),
                'openai' => $this->callOpenAI($messages, $systemPrompt, $options),
                'anthropic' => $this->callAnthropic($messages, $systemPrompt, $options),
                default => $this->callGemini($messages, $systemPrompt, $options),
            };

            $this->conversationManager->saveMessages($conversation, $message, $response['content']);

            return $response;
        } catch (\Exception $e) {
            Log::error('AI Gateway error', [
                'provider' => $provider,
                'error' => $e->getMessage(),
                'conversation_id' => $conversation->id,
            ]);

            return $this->fallback($message, $conversation, $user, $options, $provider);
        }
    }

    private function selectProvider(): string
    {
        $primary = config('ai.gateway.default', 'gemini');

        return in_array($primary, array_keys($this->providers)) ? $primary : 'gemini';
    }

    private function callGemini(array $messages, string $systemPrompt, array $options): array
    {
        $config = $this->providers['gemini'] ?? [];
        $apiKey = $config['api_key'] ?? config('ai.gateway.providers.gemini.api_key');
        $model = $options['model'] ?? ($config['model'] ?? 'gemini-2.0-flash');
        $baseUrl = $config['base_url'] ?? 'https://generativelanguage.googleapis.com/v1beta';

        $url = "{$baseUrl}/models/{$model}:generateContent?key={$apiKey}";

        $formattedContents = [];
        foreach ($messages as $msg) {
            $role = ($msg['role'] ?? 'user') === 'assistant' ? 'model' : 'user';
            $formattedContents[] = [
                'role' => $role,
                'parts' => [['text' => (string) ($msg['content'] ?? '')]],
            ];
        }

        $response = Http::timeout(15)
            ->post($url, [
                'system_instruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents' => $formattedContents,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Gemini API error: '.$response->body());
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

        return [
            'content' => $text,
            'usage' => $data['usageMetadata'] ?? [],
            'model' => $model,
            'provider' => 'gemini',
        ];
    }

    private function callOpenAI(array $messages, string $systemPrompt, array $options): array
    {
        $config = $this->providers['openai'] ?? [];
        $response = Http::withToken($config['api_key'] ?? '')
            ->timeout(15)
            ->post($config['base_url'] ?? 'https://api.openai.com/v1/chat/completions', [
                'model' => $options['model'] ?? ($config['model'] ?? 'gpt-4o'),
                'messages' => array_merge(
                    [['role' => 'system', 'content' => $systemPrompt]],
                    $messages,
                ),
                'temperature' => $options['temperature'] ?? 0.7,
                'max_tokens' => $options['max_tokens'] ?? 2000,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('OpenAI API error: '.$response->body());
        }

        $data = $response->json();

        return [
            'content' => $data['choices'][0]['message']['content'] ?? '',
            'usage' => $data['usage'] ?? [],
            'model' => $data['model'] ?? '',
            'provider' => 'openai',
        ];
    }

    private function callAnthropic(array $messages, string $systemPrompt, array $options): array
    {
        $config = $this->providers['anthropic'] ?? [];
        $response = Http::withToken($config['api_key'] ?? '')
            ->withHeader('anthropic-version', '2023-06-01')
            ->timeout(15)
            ->post($config['base_url'] ?? 'https://api.anthropic.com/v1/messages', [
                'model' => $options['model'] ?? ($config['model'] ?? 'claude-3-5-sonnet-20241022'),
                'system' => $systemPrompt,
                'messages' => $messages,
                'max_tokens' => $options['max_tokens'] ?? 2000,
                'temperature' => $options['temperature'] ?? 0.7,
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('Anthropic API error: '.$response->body());
        }

        $data = $response->json();

        return [
            'content' => $data['content'][0]['text'] ?? '',
            'usage' => $data['usage'] ?? [],
            'model' => $data['model'] ?? '',
            'provider' => 'anthropic',
        ];
    }

    private function buildSystemPrompt(User $user): string
    {
        $tenant = $user->tenant;
        $tenantName = $tenant?->name ?? 'InsurePal Tenant';
        $tenantType = $tenant?->type ?? 'broker';

        return <<<PROMPT
You are InsurePal AI, an intelligent insurance assistant for the InsurePal platform.
You help insurance professionals manage policies, claims, customers, and financial documents.

Tenant: {$tenantName}
Tenant Type: {$tenantType}
User: {$user->name}
Role: {$user->roles->pluck('name')->implode(', ')}

You can:
- Search and view customers, policies, quotes, and claims
- Create debit notes, credit notes, and receipts
- Generate reports and certificates
- Answer questions about insurance products and regulations

Always be professional, concise, and accurate.
PROMPT;
    }

    private function fallback(string $message, Conversation $conversation, User $user, array $options, string $failedProvider): array
    {
        $content = $this->generateIntelligentFallback($message, $user);
        $this->conversationManager->saveMessages($conversation, $message, $content);

        return [
            'content' => $content,
            'usage' => [],
            'model' => 'insurepal-ai-engine',
            'provider' => 'local-copilot',
        ];
    }

    private function generateIntelligentFallback(string $message, User $user): string
    {
        $tenantId = $user->tenant_id;
        $lower = strtolower($message);

        // 0. Broker Slip / Placement Slip / Quote Intent
        if (str_contains($lower, 'slip') || str_contains($lower, 'quote') || str_contains($lower, 'placement')) {
            $quoteCount = \App\Models\Quote::where('tenant_id', $tenantId)->count();
            $tenantName = $user->tenant?->name ?? 'your organization';

            return "I can assist you with creating and managing **Broker Placement Slips & Quotes** for {$tenantName}.\n\n".
                   "- **Recorded Quotes & Slips:** {$quoteCount}\n\n".
                   "To create a new broker slip:\n".
                   "1. **[Create New Broker Slip](/broker-slips/create)** (or [Direct Creation](/broker-slips/create-direct))\n".
                   '2. Or tell me the **Customer Name**, **Class of Business**, and **Sum Insured** right here to calculate the premium and draft the slip!';
        }

        // 1. Policy Queries
        if (str_contains($lower, 'polic') || str_contains($lower, 'how many polic')) {
            $total = \App\Models\Policy::where('tenant_id', $tenantId)->count();
            $active = \App\Models\Policy::where('tenant_id', $tenantId)->where('status', 'active')->count();
            $draft = \App\Models\Policy::where('tenant_id', $tenantId)->where('status', 'draft')->count();
            $cancelled = \App\Models\Policy::where('tenant_id', $tenantId)->whereIn('status', ['cancelled', 'expired'])->count();

            $tenantName = $user->tenant?->name ?? 'your organization';

            return "You currently have **{$total} policies** recorded under {$tenantName}.\n\n".
                   "- **Active Policies:** {$active}\n".
                   "- **Draft / Pending Policies:** {$draft}\n".
                   "- **Expired / Cancelled Policies:** {$cancelled}\n\n".
                   'Would you like me to issue a policy, calculate a premium, or generate a policy certificate?';
        }

        // 2. Claim Queries
        if (str_contains($lower, 'claim') || str_contains($lower, 'how many claim')) {
            $total = \App\Models\Claim::where('tenant_id', $tenantId)->count();
            $submitted = \App\Models\Claim::where('tenant_id', $tenantId)->where('status', 'submitted')->count();
            $approved = \App\Models\Claim::where('tenant_id', $tenantId)->where('status', 'approved')->count();
            $settled = \App\Models\Claim::where('tenant_id', $tenantId)->where('status', 'settled')->count();

            $tenantName = $user->tenant?->name ?? 'your organization';

            return "You have **{$total} registered claims** for {$tenantName}.\n\n".
                   "- **Pending Review:** {$submitted}\n".
                   "- **Approved Claims:** {$approved}\n".
                   "- **Settled Claims:** {$settled}\n\n".
                   'Let me know if you would like to register a new claim or approve a pending claim.';
        }

        // 3. Customer Queries
        if (str_contains($lower, 'customer') || str_contains($lower, 'client') || str_contains($lower, 'how many customer')) {
            $total = \App\Models\Customer::where('tenant_id', $tenantId)->count();
            $individuals = \App\Models\Customer::where('tenant_id', $tenantId)->where('type', 'individual')->count();
            $corporate = \App\Models\Customer::where('tenant_id', $tenantId)->where('type', 'corporate')->count();

            return "Your organization currently manages **{$total} customers**.\n\n".
                   "- **Individual Customers:** {$individuals}\n".
                   "- **Corporate Clients:** {$corporate}\n\n".
                   'I can help you search for customer records or create debit notes for any client.';
        }

        // 4. Financial / Debit Notes / Credit Notes
        if (str_contains($lower, 'debit') || str_contains($lower, 'financial') || str_contains($lower, 'revenue') || str_contains($lower, 'invoice')) {
            $debitCount = \App\Models\DebitNote::where('tenant_id', $tenantId)->count();
            $totalAmount = \App\Models\DebitNote::where('tenant_id', $tenantId)->sum('total_amount');
            $formattedAmount = '₦'.number_format((float) $totalAmount, 2);

            $tenantName = $user->tenant?->name ?? 'your organization';

            return "Financial Summary for {$tenantName}:\n\n".
                   "- **Total Debit Notes Issued:** {$debitCount}\n".
                   "- **Gross Invoice Volume:** {$formattedAmount}\n\n".
                   'Would you like me to generate a new debit note, credit note, or payment receipt?';
        }

        // 5. Default contextual response
        $tenantName = $user->tenant?->name ?? 'your organization';

        return "I am InsurePal AI Copilot for {$tenantName}.\n\n".
               "I can assist you with:\n".
               "- **Policies**: Counting, issuing, renewing, or cancelling policies\n".
               "- **Claims**: Registering claims and processing claim approvals\n".
               "- **Financials**: Creating debit notes, credit notes, and receipts\n".
               "- **Reports**: Generating business performance and NAICOM reports\n\n".
               'What would you like me to do for you?';
    }
}
