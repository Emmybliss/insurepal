<?php

namespace App\Services\Email;

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Models\EmailMessage;
use Illuminate\Support\Facades\Log;

class EmailSyncService
{
    public function __construct(
        private EmailProviderFactory $providerFactory,
        private EmailThreadingService $threadingService,
        private EmailEntityMatcherService $entityMatcher,
    ) {}

    public function syncFolder(EmailFolder $folder): void
    {
        $account = $folder->account;
        if (! $account) {
            return;
        }

        try {
            $provider = $this->providerFactory->make($account);
            $result = $provider->fetchMessages($account, $folder, $account->delta_token);
            $fetchedMessages = $result['messages'] ?? [];

            foreach ($fetchedMessages as $msgData) {
                $msgData['account_id'] = $account->id;
                $msgData['folder_id'] = $folder->id;

                $remoteId = $msgData['message_id_remote'] ?? $msgData['remote_id'] ?? null;
                $headerId = $msgData['message_id_header'] ?? null;

                if (! $remoteId && ! $headerId) {
                    continue;
                }

                $existing = EmailMessage::where('account_id', $account->id)
                    ->where(function ($q) use ($remoteId, $headerId) {
                        if ($remoteId) {
                            $q->where('message_id_remote', $remoteId);
                        }
                        if ($headerId) {
                            $q->orWhere('message_id_header', $headerId);
                        }
                    })->first();

                if ($existing) {
                    continue;
                }

                $thread = $this->threadingService->resolveThread($msgData, $account);
                $msgData['email_thread_id'] = $thread->id;

                $message = EmailMessage::create($msgData);
                $this->entityMatcher->matchAndLinkEntities($message, $thread);
            }
        } catch (\Throwable $e) {
            Log::error('Folder sync failed', ['folder_id' => $folder->id, 'error' => $e->getMessage()]);
        }
    }

    public function syncAccount(EmailAccount $account, bool $forceFullSync = false): array
    {
        $stats = [
            'folders_synced' => 0,
            'messages_synced' => 0,
            'errors' => [],
        ];

        $account->update(['sync_status' => 'syncing', 'sync_error' => null]);

        try {
            $provider = $this->providerFactory->make($account);

            // Discover and update folders
            $foldersData = $provider->fetchFolders($account);

            foreach ($foldersData as $folderData) {
                $matchCriteria = ['account_id' => $account->id];
                if (in_array($folderData['type'], ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'])) {
                    $matchCriteria['type'] = $folderData['type'];
                } else {
                    $matchCriteria['remote_id'] = $folderData['remote_id'];
                }

                $folder = EmailFolder::updateOrCreate(
                    $matchCriteria,
                    [
                        'name' => $folderData['name'],
                        'remote_id' => $folderData['remote_id'],
                        'type' => $folderData['type'],
                    ]
                );

                $stats['folders_synced']++;

                // Fetch new/updated messages incrementally with pagination per folder
                $page = 0;
                $maxPagesPerFolder = 10;
                $folderCursor = ($forceFullSync ? '0' : (($account->provider === 'imap')
                    ? (string) ($folder->messages()->max('uid') ?? 0)
                    : $account->delta_token));

                do {
                    $result = $provider->fetchMessages($account, $folder, $folderCursor);
                    $fetchedMessages = $result['messages'] ?? [];
                    $nextCursor = $result['next_cursor'] ?? null;

                    if (empty($fetchedMessages)) {
                        break;
                    }

                    foreach ($fetchedMessages as $msgData) {
                        $remoteId = $msgData['message_id_remote'] ?? null;
                        $messageIdHeader = $msgData['message_id_header'] ?? null;

                        if (! $remoteId && ! $messageIdHeader) {
                            continue;
                        }

                        // Create or update EmailMessage
                        $message = EmailMessage::updateOrCreate(
                            [
                                'account_id' => $account->id,
                                'message_id_remote' => $remoteId,
                            ],
                            [
                                'account_id' => $account->id,
                                'folder_id' => $folder->id,
                                'message_id_header' => $messageIdHeader,
                                'uid' => $msgData['uid'] ?? null,
                                'thread_id' => $msgData['thread_id'] ?? null,
                                'subject' => $msgData['subject'] ?? null,
                                'body_html' => $msgData['body_html'] ?? null,
                                'body_text' => $msgData['body_text'] ?? null,
                                'from_address' => $msgData['from_address'] ?? '',
                                'from_name' => $msgData['from_name'] ?? null,
                                'to_recipients' => $msgData['to_recipients'] ?? [],
                                'cc_recipients' => $msgData['cc_recipients'] ?? null,
                                'bcc_recipients' => $msgData['bcc_recipients'] ?? null,
                                'received_at' => $msgData['received_at'] ?? now(),
                                'is_read' => $msgData['is_read'] ?? false,
                                'is_flagged' => $msgData['is_flagged'] ?? false,
                                'size' => $msgData['size'] ?? 0,
                                'in_reply_to' => $msgData['in_reply_to'] ?? null,
                                'references' => $msgData['references'] ?? null,
                            ]
                        );

                        // Thread message using EmailThreadingService
                        $thread = $this->threadingService->resolveThreadForMessage($account, $msgData, $message);

                        // Auto-link message and thread to Customer, Policy, Claim, Quote, Invoice
                        $this->entityMatcher->matchAndLinkEntities($message, $thread);

                        $stats['messages_synced']++;
                    }

                    $page++;

                    if ($account->provider === 'imap') {
                        $folderCursor = (string) ($folder->messages()->max('uid') ?? 0);
                        $hasMore = count($fetchedMessages) >= 250;
                    } else {
                        $folderCursor = $nextCursor;
                        $hasMore = ! empty($nextCursor) && $nextCursor !== $account->delta_token;
                        if ($nextCursor) {
                            $account->update(['delta_token' => $nextCursor]);
                        }
                    }
                } while ($hasMore && $page < $maxPagesPerFolder);
            }

            $account->update([
                'sync_status' => 'idle',
                'sync_error' => null,
                'last_sync_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('EmailSyncService account sync failed', [
                'account_id' => $account->id,
                'error' => $e->getMessage(),
            ]);

            $account->update([
                'sync_status' => 'error',
                'sync_error' => $e->getMessage(),
            ]);

            $stats['errors'][] = $e->getMessage();
        }

        return $stats;
    }

    public function fullSync(EmailAccount $account): array
    {
        return $this->syncAccount($account, true);
    }
}
