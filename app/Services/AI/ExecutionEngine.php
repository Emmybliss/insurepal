<?php

namespace App\Services\AI;

use App\Models\Conversation;
use App\Models\ToolExecution;
use App\Models\User;

class ExecutionEngine
{
    public function __construct(
        private ToolRegistry $toolRegistry,
        private AIGatewayService $gateway,
        private ConversationManager $conversationManager,
    ) {}

    public function execute(User $user, Conversation $conversation, array $intent): array
    {
        $tool = $this->toolRegistry->get($intent['tool']);

        if (! $tool) {
            return [
                'conversation_id' => $conversation->id,
                'message' => "I'm sorry, I don't have access to the '{$intent['tool']}' tool.",
            ];
        }

        if (! $tool->authorize($user)) {
            return [
                'conversation_id' => $conversation->id,
                'message' => "You don't have permission to use this tool.",
            ];
        }

        $execution = ToolExecution::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'conversation_id' => $conversation->id,
            'tool_name' => $tool->name(),
            'parameters' => [],
            'status' => $tool->requiresApproval() ? 'pending' : 'completed',
        ]);

        if ($tool->requiresApproval()) {
            return [
                'conversation_id' => $conversation->id,
                'execution_id' => $execution->id,
                'message' => 'This action requires approval. An approval request has been created.',
                'requires_approval' => true,
            ];
        }

        try {
            $result = $tool->execute([], $user);

            $execution->update([
                'status' => $result->success ? 'completed' : 'failed',
                'result' => $result->success ? $result->data : null,
                'error_message' => $result->error,
            ]);

            $responseMessage = $result->message ?? ($result->success ? 'Action completed successfully.' : 'Action failed.');

            $this->conversationManager->saveMessages(
                $conversation,
                "Execute: {$tool->name()}",
                $responseMessage,
            );

            return [
                'conversation_id' => $conversation->id,
                'message' => $responseMessage,
                'data' => $result->data,
            ];
        } catch (\Exception $e) {
            $execution->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return [
                'conversation_id' => $conversation->id,
                'message' => "Error executing action: {$e->getMessage()}",
            ];
        }
    }
}
