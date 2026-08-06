<?php

namespace App\Services\AI\Tools;

use App\Models\Notification;
use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;

class ScheduleReminderTool implements ToolContract
{
    public function name(): string
    {
        return 'schedule_reminder';
    }

    public function description(): string
    {
        return 'Schedule a reminder or follow-up notification for a policy, claim, or task';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'title' => ['type' => 'string', 'description' => 'Reminder title'],
                'message' => ['type' => 'string', 'description' => 'Reminder message / details'],
                'remind_at' => ['type' => 'string', 'description' => 'Target date/time for reminder (YYYY-MM-DD or YYYY-MM-DD HH:MM)'],
            ],
            'required' => ['title', 'message', 'remind_at'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        try {
            $remindAt = \Carbon\Carbon::parse($params['remind_at']);

            $notification = Notification::create([
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'type' => 'reminder',
                'title' => $params['title'],
                'message' => $params['message'],
                'data' => [
                    'scheduled_for' => $remindAt->toISOString(),
                    'created_via' => 'ai_copilot',
                ],
                'read_at' => null,
            ]);

            return new ToolResult(
                success: true,
                data: $notification->toArray(),
                message: "Reminder '{$params['title']}' scheduled for {$remindAt->format('Y-m-d H:i')}."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to schedule reminder: {$e->getMessage()}",
                error: $e->getMessage()
            );
        }
    }

    public function authorize(User $user): bool
    {
        return true;
    }

    public function requiresApproval(): bool
    {
        return false;
    }
}
