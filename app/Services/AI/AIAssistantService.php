<?php

namespace App\Services\AI;

use App\Models\User;
use App\Services\AuditService;

class AIAssistantService
{
    public function __construct(
        private AIGatewayService $gateway,
        private ConversationManager $conversationManager,
        private ContextManager $contextManager,
        private ToolRegistry $toolRegistry,
        private ExecutionEngine $executionEngine,
        private AuditService $auditService,
    ) {}

    public function chat(User $user, string $message, ?int $conversationId = null, ?string $contextType = null, ?int $contextId = null): array
    {
        $conversation = $this->conversationManager->findOrCreate($user, $conversationId, $contextType, $contextId);

        $intent = $this->parseIntent($message);

        if ($intent && $this->toolRegistry->hasTool($intent['tool'])) {
            return $this->executionEngine->execute($user, $conversation, $intent);
        }

        $response = $this->gateway->chat($message, $conversation, $user);

        $this->auditService->log(
            'ai_chat',
            $conversation,
            $user,
            ['message_length' => strlen($message), 'response_length' => strlen($response['content'])],
            "AI chat: {$conversation->title}",
        );

        return [
            'conversation_id' => $conversation->id,
            'message' => $response['content'],
            'usage' => $response['usage'],
            'model' => $response['model'],
        ];
    }

    private function parseIntent(string $message): ?array
    {
        $patterns = [
            '/create debit note/i' => ['tool' => 'create_debit_note', 'requires_approval' => true],
            '/create credit note/i' => ['tool' => 'create_credit_note', 'requires_approval' => true],
            '/issue policy/i' => ['tool' => 'issue_policy', 'requires_approval' => true],
            '/cancel policy/i' => ['tool' => 'cancel_policy', 'requires_approval' => true],
            '/register claim/i' => ['tool' => 'register_claim', 'requires_approval' => true],
            '/approve claim/i' => ['tool' => 'approve_claim', 'requires_approval' => true],
            '/search customer/i' => ['tool' => 'search_customer', 'requires_approval' => false],
            '/search policy/i' => ['tool' => 'search_policy', 'requires_approval' => false],
            '/generate quote/i' => ['tool' => 'generate_quote', 'requires_approval' => false],
            '/calculate premium/i' => ['tool' => 'calculate_premium', 'requires_approval' => false],
            '/generate report/i' => ['tool' => 'generate_report', 'requires_approval' => true],
        ];

        foreach ($patterns as $pattern => $intent) {
            if (preg_match($pattern, $message)) {
                return $intent;
            }
        }

        return null;
    }
}
