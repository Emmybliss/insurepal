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
                'openai' => $this->callOpenAI($messages, $systemPrompt, $options),
                'anthropic' => $this->callAnthropic($messages, $systemPrompt, $options),
                default => $this->callOpenAI($messages, $systemPrompt, $options),
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
        $primary = config('ai.gateway.default', 'openai');

        return in_array($primary, array_keys($this->providers)) ? $primary : 'openai';
    }

    private function callOpenAI(array $messages, string $systemPrompt, array $options): array
    {
        $config = $this->providers['openai'] ?? [];
        $response = Http::withToken($config['api_key'] ?? '')
            ->timeout(60)
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
            ->timeout(60)
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

        return <<<PROMPT
You are InsurePal AI, an intelligent insurance assistant for the InsurePal platform.
You help insurance professionals manage policies, claims, customers, and financial documents.

Tenant: {$tenant->name}
Tenant Type: {$tenant->type}
User: {$user->name}
Role: {$user->roles->pluck('name')->implode(', ')}

You can:
- Search and view customers, policies, quotes, and claims
- Create debit notes, credit notes, and receipts
- Generate reports and certificates
- Answer questions about insurance products and regulations

Always be professional, concise, and accurate. If you don't know something, say so.
For any action that could have financial impact, ask for confirmation first.
PROMPT;
    }

    private function fallback(string $message, Conversation $conversation, User $user, array $options, string $failedProvider): array
    {
        $remaining = array_keys(array_diff_key($this->providers, [$failedProvider => true]));

        if (empty($remaining)) {
            return [
                'content' => 'I apologize, but I\'m currently unable to process your request. All AI providers are unavailable. Please try again later.',
                'usage' => [],
                'model' => 'none',
                'provider' => 'none',
            ];
        }

        $this->providers = array_intersect_key($this->providers, array_flip($remaining));

        return $this->chat($message, $conversation, $user, $options);
    }
}
