<?php

namespace App\Services\Email;

use App\Models\EmailAccount;
use App\Models\EmailMessage;
use App\Models\EmailThread;

class EmailThreadingService
{
    public function resolveThread(array $messageData, EmailAccount $account): EmailThread
    {
        $dummyMessage = new EmailMessage([
            'subject' => $messageData['subject'] ?? null,
            'from_address' => $messageData['from_address'] ?? null,
            'to_recipients' => $messageData['to_recipients'] ?? [],
            'cc_recipients' => $messageData['cc_recipients'] ?? [],
            'in_reply_to' => $messageData['in_reply_to'] ?? null,
            'references' => $messageData['references'] ?? null,
            'received_at' => $messageData['received_at'] ?? now(),
        ]);

        return $this->resolveThreadForMessage($account, $messageData, $dummyMessage);
    }

    public function resolveThreadForMessage(EmailAccount $account, array $messageData, EmailMessage $message): EmailThread
    {
        $tenantId = $account->tenant_id;
        $inReplyTo = $messageData['in_reply_to'] ?? $message->in_reply_to ?? null;
        $references = $messageData['references'] ?? $message->references ?? [];

        // 1. Try matching via In-Reply-To header
        if (! empty($inReplyTo)) {
            $parentMessage = EmailMessage::whereHas('account', fn ($q) => $q->where('tenant_id', $tenantId))
                ->where('message_id_header', $inReplyTo)
                ->whereNotNull('email_thread_id')
                ->first();

            if ($parentMessage && $parentMessage->thread) {
                return $this->attachMessageToThread($parentMessage->thread, $messageData, $message);
            }
        }

        // 2. Try matching via References headers
        if (! empty($references) && is_array($references)) {
            $parentMessage = EmailMessage::whereHas('account', fn ($q) => $q->where('tenant_id', $tenantId))
                ->whereIn('message_id_header', $references)
                ->whereNotNull('email_thread_id')
                ->first();

            if ($parentMessage && $parentMessage->thread) {
                return $this->attachMessageToThread($parentMessage->thread, $messageData, $message);
            }
        }

        // 3. Try subject normalization matching (within last 30 days)
        $rawSubject = $messageData['subject'] ?? $message->subject ?? '';
        $normalizedSubject = $this->normalizeSubject($rawSubject);

        if (! empty($normalizedSubject)) {
            $existingThread = EmailThread::where('tenant_id', $tenantId)
                ->where('subject_normalized', $normalizedSubject)
                ->where('last_message_at', '>=', now()->subDays(30))
                ->first();

            if ($existingThread) {
                return $this->attachMessageToThread($existingThread, $messageData, $message);
            }
        }

        // 4. Fallback: Create a new conversation thread for this tenant
        $participants = array_filter(array_unique(array_merge(
            [$messageData['from_address'] ?? $message->from_address],
            $messageData['to_recipients'] ?? $message->to_recipients ?? [],
            $messageData['cc_recipients'] ?? $message->cc_recipients ?? []
        )));

        $thread = EmailThread::create([
            'tenant_id' => $tenantId,
            'account_id' => $account->id,
            'subject' => $rawSubject,
            'subject_normalized' => $normalizedSubject,
            'first_message_at' => $messageData['received_at'] ?? $message->received_at ?? now(),
            'last_message_at' => $messageData['received_at'] ?? $message->received_at ?? now(),
            'participant_addresses' => array_values($participants),
            'status' => 'open',
            'is_unread' => true,
        ]);

        $message->update(['email_thread_id' => $thread->id]);

        return $thread;
    }

    private function attachMessageToThread(EmailThread $thread, array $messageData, EmailMessage $message): EmailThread
    {
        $message->update(['email_thread_id' => $thread->id]);

        $participants = array_filter(array_unique(array_merge(
            $thread->participant_addresses ?? [],
            [$messageData['from_address'] ?? $message->from_address],
            $messageData['to_recipients'] ?? $message->to_recipients ?? [],
            $messageData['cc_recipients'] ?? $message->cc_recipients ?? []
        )));

        $thread->update([
            'last_message_at' => max($thread->last_message_at ?: now(), $messageData['received_at'] ?? $message->received_at ?? now()),
            'participant_addresses' => array_values($participants),
            'is_unread' => true,
        ]);

        return $thread;
    }

    public function normalizeSubject(string $subject): string
    {
        $clean = preg_replace('/^(re|fwd|fw|re\[\d+\]|fwd\[\d+\]):\s*/i', '', trim($subject));
        $clean = preg_replace('/\[ref:\s*[^\]]+\]/i', '', $clean);

        return strtolower(trim($clean));
    }
}
