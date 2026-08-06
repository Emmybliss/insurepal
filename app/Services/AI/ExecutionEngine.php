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

        $parameters = $intent['parameters'] ?? [];

        $execution = ToolExecution::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'conversation_id' => $conversation->id,
            'tool_name' => $tool->name(),
            'parameters' => $parameters,
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
            $result = $tool->execute($parameters, $user);

            $execution->update([
                'status' => $result->success ? 'completed' : 'failed',
                'result' => $result->success ? $result->data : null,
                'error_message' => $result->error,
            ]);

            $responseMessage = $result->message ?? ($result->success ? 'Action completed successfully.' : 'Action failed.');

            $userMsg = $intent['user_message'] ?? "Execute: {$tool->name()}";
            $this->conversationManager->saveMessages(
                $conversation,
                $userMsg,
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

    public function executeApproved(ToolExecution $execution, User $user): ToolResult
    {
        $tool = $this->toolRegistry->get($execution->tool_name);

        if (! $tool) {
            $execution->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            return new ToolResult(true, [], 'Action approved');
        }

        if (! $tool->authorize($user)) {
            $execution->update(['status' => 'failed', 'error_message' => 'Unauthorized']);

            return new ToolResult(false, [], 'User not authorized to execute tool.', 'Unauthorized');
        }

        try {
            $params = $execution->parameters ?? [];
            if (! empty($params)) {
                $result = $tool->execute($params, $user);
                $isSuccess = $result->success;
                $message = $result->message;
                $data = $result->data;
                $error = $result->error;
            } else {
                $isSuccess = true;
                $message = 'Action approved';
                $data = [];
                $error = null;
            }

            $execution->update([
                'status' => $isSuccess ? 'approved' : 'failed',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'result' => $data,
                'error_message' => $error,
            ]);

            if ($execution->conversation) {
                $this->conversationManager->saveMessages(
                    $execution->conversation,
                    "Approved Execution: {$tool->name()}",
                    $message ?? 'Action executed successfully upon approval.'
                );
            }

            return new ToolResult($isSuccess, $data, $message ?? 'Action approved', $error);
        } catch (\Exception $e) {
            $execution->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return new ToolResult(false, [], "Error executing action: {$e->getMessage()}", $e->getMessage());
        }
    }
}
