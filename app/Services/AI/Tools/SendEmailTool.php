<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;
use App\Services\Email\EmailSendService;

class SendEmailTool implements ToolContract
{
    public function __construct(
        private EmailSendService $emailSendService
    ) {}

    public function name(): string
    {
        return 'send_email';
    }

    public function description(): string
    {
        return 'Send an email notification or message to a customer or underwriter';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'to' => ['type' => 'string', 'description' => 'Recipient email address'],
                'subject' => ['type' => 'string', 'description' => 'Email subject line'],
                'body' => ['type' => 'string', 'description' => 'Email text message content'],
            ],
            'required' => ['to', 'subject', 'body'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        try {
            $account = $user->tenant->emailAccounts()->first();

            if (! $account) {
                return new ToolResult(
                    success: false,
                    data: [],
                    message: 'No active email account connected for this tenant.',
                    error: 'No email account'
                );
            }

            $result = $this->emailSendService->send(
                account: $account,
                to: $params['to'],
                subject: $params['subject'],
                body: $params['body'],
                htmlBody: '<p>'.nl2br(e($params['body'])).'</p>'
            );

            return new ToolResult(
                success: true,
                data: $result,
                message: "Email sent to {$params['to']} with subject '{$params['subject']}'."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to send email: {$e->getMessage()}",
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
        return true;
    }
}
