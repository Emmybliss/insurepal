<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AI\ChatRequest;
use App\Models\Conversation;
use App\Models\ToolExecution;
use App\Services\AI\AIAssistantService;
use App\Services\AI\ToolRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIAssistantController extends Controller
{
    public function __construct(
        private AIAssistantService $aiService,
        private ToolRegistry $toolRegistry,
    ) {}

    public function chat(ChatRequest $request): JsonResponse
    {
        $result = $this->aiService->chat(
            user: $request->user(),
            message: $request->input('message'),
            conversationId: $request->input('conversation_id'),
            contextType: $request->input('context_type'),
            contextId: $request->input('context_id'),
        );

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $conversations = Conversation::where('user_id', $request->user()->id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $conversations->items(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
                'last_page' => $conversations->lastPage(),
            ],
        ]);
    }

    public function showConversation(Request $request, int $id): JsonResponse
    {
        $conversation = Conversation::with('messages')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $conversation,
        ]);
    }

    public function deleteConversation(Request $request, int $id): JsonResponse
    {
        $conversation = Conversation::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted',
        ]);
    }

    public function approvals(Request $request): JsonResponse
    {
        $executions = ToolExecution::with('conversation')
            ->where('tenant_id', $request->user()->tenant_id)
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $executions->items(),
            'meta' => [
                'current_page' => $executions->currentPage(),
                'per_page' => $executions->perPage(),
                'total' => $executions->total(),
                'last_page' => $executions->lastPage(),
            ],
        ]);
    }

    public function approveAction(Request $request, int $id): JsonResponse
    {
        $execution = ToolExecution::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->where('status', 'pending')
            ->firstOrFail();

        $execution->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Action approved',
        ]);
    }

    public function rejectAction(Request $request, int $id): JsonResponse
    {
        $execution = ToolExecution::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->where('status', 'pending')
            ->firstOrFail();

        $execution->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Action rejected',
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $user = $request->user();
        $suggestions = [];

        $expiringPolicies = $user->tenant->policies()
            ->where('status', 'active')
            ->where('expiry_date', '<=', now()->addDays(30))
            ->count();

        if ($expiringPolicies > 0) {
            $suggestions[] = [
                'label' => 'Renew expiring policies',
                'description' => "{$expiringPolicies} policies expiring soon",
                'prompt' => 'Show me policies expiring in the next 30 days',
            ];
        }

        $pendingClaims = $user->tenant->claims()
            ->where('status', 'submitted')
            ->count();

        if ($pendingClaims > 0) {
            $suggestions[] = [
                'label' => 'Review pending claims',
                'description' => "{$pendingClaims} claims awaiting review",
                'prompt' => 'Show me pending claims that need review',
            ];
        }

        $suggestions[] = [
            'label' => 'Generate a report',
            'description' => 'Create NAICOM or custom report',
            'prompt' => 'Help me generate a report',
        ];

        return response()->json([
            'success' => true,
            'data' => $suggestions,
        ]);
    }
}
