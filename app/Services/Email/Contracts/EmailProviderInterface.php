<?php

namespace App\Services\Email\Contracts;

use App\Models\EmailAccount;
use App\Models\EmailFolder;

interface EmailProviderInterface
{
    /**
     * Test connection/credentials for an account without saving.
     *
     * @return array{success: bool, error: ?string}
     */
    public function testConnection(EmailAccount $account): array;

    /**
     * Refresh OAuth access token if applicable.
     */
    public function refreshToken(EmailAccount $account): bool;

    /**
     * Discover or list folders for the account.
     *
     * @return array<int, array{name: string, remote_id: string, type: string}>
     */
    public function fetchFolders(EmailAccount $account): array;

    /**
     * Fetch messages incrementally for a folder.
     *
     * @return array{messages: array<int, array>, next_cursor: ?string}
     */
    public function fetchMessages(EmailAccount $account, EmailFolder $folder, ?string $cursor = null): array;

    /**
     * Send an email payload via the provider.
     *
     * @param  array{to: string, subject: string, body_text: string, body_html: ?string, cc: ?string, bcc: ?string, attachments: array}  $payload
     * @return array{success: bool, message_id: ?string, error: ?string}
     */
    public function sendMessage(EmailAccount $account, array $payload): array;
}
