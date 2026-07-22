<?php

namespace App\Services\AI;

use App\Models\AiMessage;
use App\Models\Conversation;
use App\Models\User;

class ConversationManager
{
    public function findOrCreate(User $user, ?int $conversationId = null, ?string $contextType = null, ?int $contextId = null): Conversation
    {
        if ($conversationId) {
            $conversation = Conversation::where('id', $conversationId)
                ->where('user_id', $user->id)
                ->where('tenant_id', $user->tenant_id)
                ->firstOrFail();

            return $conversation;
        }

        $title = $contextType
            ? ucfirst($contextType).' '.\Illuminate\Support\Str::title($contextType ?? '')
            : 'New Conversation';

        return Conversation::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'title' => $title,
            'context_type' => $contextType,
            'context_id' => $contextId,
        ]);
    }

    public function buildMessages(Conversation $conversation, string $newMessage): array
    {
        $history = $conversation->messages()
            ->where('role', '!=', 'system')
            ->orderBy('created_at')
            ->get()
            ->map(fn (AiMessage $m) => [
                'role' => $m->role,
                'content' => $m->content,
            ])
            ->toArray();

        $history[] = ['role' => 'user', 'content' => $newMessage];

        return $history;
    }

    public function saveMessages(Conversation $conversation, string $userMessage, string $assistantResponse): void
    {
        AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $userMessage,
        ]);

        AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $assistantResponse,
        ]);

        if ($conversation->messages()->count() <= 2) {
            $conversation->update([
                'title' => \Illuminate\Support\Str::limit($userMessage, 100),
            ]);
        }
    }
}
