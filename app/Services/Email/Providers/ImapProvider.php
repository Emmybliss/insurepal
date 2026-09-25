<?php

namespace App\Services\Email\Providers;

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Services\Email\Contracts\EmailProviderInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ImapProvider implements EmailProviderInterface
{
    public function testConnection(EmailAccount $account): array
    {
        $host = $account->imap_host;
        $port = (int) ($account->imap_port ?: 993);
        $password = $account->getDecryptedPassword();
        $encryption = strtolower($account->imap_encryption ?: ($port === 993 ? 'ssl' : 'tls'));

        if (! $host || ! $account->email || ! $password) {
            return ['success' => false, 'error' => 'Missing IMAP host, email, or password.'];
        }

        $stream = $this->connectSocket($host, $port, $encryption);
        if (! $stream) {
            return ['success' => false, 'error' => "Could not connect to IMAP server {$host}:{$port}."];
        }

        try {
            $loginRes = $this->sendSocketCommand($stream, 'LOGIN "'.$account->email.'" "'.$this->escapeImapString($password).'"');
            if (str_contains(strtoupper($loginRes), 'OK')) {
                $this->sendSocketCommand($stream, 'LOGOUT');
                fclose($stream);

                return ['success' => true, 'error' => null];
            }

            fclose($stream);

            return ['success' => false, 'error' => 'IMAP Authentication failed. Please verify credentials.'];
        } catch (\Throwable $e) {
            if (is_resource($stream)) {
                fclose($stream);
            }

            return ['success' => false, 'error' => 'IMAP error: '.$e->getMessage()];
        }
    }

    public function refreshToken(EmailAccount $account): bool
    {
        return true;
    }

    public function fetchFolders(EmailAccount $account): array
    {
        $host = $account->imap_host;
        $port = (int) ($account->imap_port ?: 993);
        $password = $account->getDecryptedPassword();
        $encryption = strtolower($account->imap_encryption ?: ($port === 993 ? 'ssl' : 'tls'));

        if (! $host || ! $account->email || ! $password) {
            return $this->getDefaultFolders();
        }

        try {
            $stream = $this->connectSocket($host, $port, $encryption);
            if (! $stream) {
                return $this->getDefaultFolders();
            }

            $loginRes = $this->sendSocketCommand($stream, 'LOGIN "'.$account->email.'" "'.$this->escapeImapString($password).'"');
            if (! str_contains(strtoupper($loginRes), 'OK')) {
                fclose($stream);

                return $this->getDefaultFolders();
            }

            $listRes = $this->sendSocketCommand($stream, 'LIST "" "*"');
            $this->sendSocketCommand($stream, 'LOGOUT');
            fclose($stream);

            $folders = $this->parseImapListResponse($listRes);

            return ! empty($folders) ? $folders : $this->getDefaultFolders();
        } catch (\Throwable $e) {
            Log::warning('IMAP fetchFolders failed, using default folder structure', ['error' => $e->getMessage()]);

            return $this->getDefaultFolders();
        }
    }

    private function parseImapListResponse(string $rawList): array
    {
        $lines = explode("\n", str_replace("\r", '', $rawList));
        $folders = [];

        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            if (! str_starts_with(strtoupper($trimmedLine), '* LIST')) {
                continue;
            }

            $flagsStr = '';
            if (preg_match('/\(([^)]*)\)/', $line, $fm)) {
                $flagsStr = strtolower($fm[1]);
            }

            $remoteId = null;
            if (preg_match('/"([^"]+)"\s*$/', $line, $nm)) {
                $remoteId = $nm[1];
            } elseif (preg_match('/\s+(\S+)\s*$/', $line, $nm)) {
                $remoteId = trim($nm[1]);
            }

            if (! $remoteId) {
                continue;
            }

            $remoteLower = strtolower($remoteId);
            $type = 'custom';
            $name = basename(str_replace('.', '/', $remoteId));

            if ($remoteLower === 'inbox') {
                $type = 'inbox';
                $name = 'INBOX';
            } elseif (str_contains($flagsStr, '\sent') || str_ends_with($remoteLower, 'sent') || str_ends_with($remoteLower, 'sent messages') || str_ends_with($remoteLower, 'sent items')) {
                $type = 'sent';
                $name = 'Sent';
            } elseif (str_contains($flagsStr, '\drafts') || str_ends_with($remoteLower, 'drafts') || str_ends_with($remoteLower, 'draft')) {
                $type = 'drafts';
                $name = 'Drafts';
            } elseif (str_contains($flagsStr, '\trash') || str_contains($flagsStr, '\deleted') || str_ends_with($remoteLower, 'trash') || str_ends_with($remoteLower, 'deleted items') || str_ends_with($remoteLower, 'deleted messages')) {
                $type = 'trash';
                $name = 'Trash';
            } elseif (str_contains($flagsStr, '\junk') || str_contains($flagsStr, '\spam') || str_ends_with($remoteLower, 'junk') || str_ends_with($remoteLower, 'spam') || str_ends_with($remoteLower, 'junk e-mail')) {
                $type = 'spam';
                $name = 'Spam';
            } elseif (str_contains($flagsStr, '\archive') || str_ends_with($remoteLower, 'archive')) {
                $type = 'archive';
                $name = 'Archive';
            }

            $folders[] = [
                'name' => ucfirst($name),
                'remote_id' => $remoteId,
                'type' => $type,
            ];
        }

        return $folders;
    }

    private function getDefaultFolders(): array
    {
        return [
            ['name' => 'INBOX', 'remote_id' => 'INBOX', 'type' => 'inbox'],
            ['name' => 'Sent', 'remote_id' => 'INBOX.Sent', 'type' => 'sent'],
            ['name' => 'Drafts', 'remote_id' => 'INBOX.Drafts', 'type' => 'drafts'],
            ['name' => 'Trash', 'remote_id' => 'INBOX.Trash', 'type' => 'trash'],
            ['name' => 'Spam', 'remote_id' => 'INBOX.spam', 'type' => 'spam'],
        ];
    }

    public function fetchMessages(EmailAccount $account, EmailFolder $folder, ?string $cursor = null): array
    {
        $host = $account->imap_host;
        $port = (int) ($account->imap_port ?: 993);
        $password = $account->getDecryptedPassword();
        $encryption = strtolower($account->imap_encryption ?: ($port === 993 ? 'ssl' : 'tls'));

        if (! $host || ! $account->email || ! $password) {
            return ['messages' => [], 'next_cursor' => $cursor];
        }

        // Try ext-imap if installed, or fallback to Socket IMAP stream
        if (function_exists('imap_open')) {
            return $this->fetchViaExtImap($account, $folder, $cursor, $host, $port, $password, $encryption);
        }

        return $this->fetchViaSocketImap($account, $folder, $cursor, $host, $port, $password, $encryption);
    }

    public function sendMessage(EmailAccount $account, array $payload): array
    {
        // IMAP does not send mail directly; delegate sending to SmtpProvider
        $smtpProvider = new SmtpProvider;

        return $smtpProvider->sendMessage($account, $payload);
    }

    private function fetchViaExtImap(EmailAccount $account, EmailFolder $folder, ?string $cursor, string $host, int $port, string $password, string $encryption): array
    {
        $encFlag = $port === 993 ? '/ssl' : ($port === 143 ? '/tls/novalidate-cert' : '/novalidate-cert');
        $mailboxStr = "{{$host}:{$port}/imap{$encFlag}}{$folder->remote_id}";

        $inbox = @imap_open($mailboxStr, $account->email, $password);
        if (! $inbox) {
            $candidates = $this->getAlternateRemoteIds($folder);
            foreach ($candidates as $cand) {
                $mailboxStr = "{{$host}:{$port}/imap{$encFlag}}{$cand}";
                $inbox = @imap_open($mailboxStr, $account->email, $password);
                if ($inbox) {
                    $folder->update(['remote_id' => $cand]);
                    break;
                }
            }
        }

        if (! $inbox) {
            Log::warning('IMAP ext_imap open failed', ['host' => $host, 'folder' => $folder->remote_id, 'error' => imap_last_error()]);

            return ['messages' => [], 'next_cursor' => $cursor];
        }

        try {
            $lastUid = ($cursor !== null && $cursor !== '' && $cursor !== '0' && is_numeric($cursor)) ? (int) $cursor : 0;
            $searchCriteria = $lastUid > 0 ? 'UID '.($lastUid + 1).':*' : 'ALL';

            $emails = imap_search($inbox, $searchCriteria, SE_UID);
            if (! $emails) {
                return ['messages' => [], 'next_cursor' => (string) $lastUid];
            }

            sort($emails);
            $maxUid = $lastUid;
            $parsedMessages = [];

            // Process up to 250 messages starting from oldest unsynced
            $emails = array_slice($emails, 0, 250);

            foreach ($emails as $uid) {
                $msgNum = imap_msgno($inbox, $uid);
                if (! $msgNum) {
                    continue;
                }

                $header = imap_headerinfo($inbox, $msgNum);
                $remoteId = "imap-uid-{$uid}";
                $messageIdHeader = ! empty($header->message_id) ? trim($header->message_id) : "<{$remoteId}@{$host}>";

                $structure = imap_fetchstructure($inbox, $msgNum);

                $bodyText = null;
                $bodyHtml = null;
                $this->extractExtImapBody($inbox, $msgNum, $structure, $bodyText, $bodyHtml);

                $to = [];
                if (isset($header->to)) {
                    foreach ($header->to as $addr) {
                        $to[] = $addr->mailbox.'@'.($addr->host ?? 'unknown');
                    }
                }

                $cc = [];
                if (isset($header->cc)) {
                    foreach ($header->cc as $addr) {
                        $cc[] = $addr->mailbox.'@'.($addr->host ?? 'unknown');
                    }
                }

                $fromAddress = ! empty($header->from[0]) ? ($header->from[0]->mailbox.'@'.($header->from[0]->host ?? 'unknown')) : '';
                $fromName = $header->from[0]->personal ?? null;

                $subject = $header->subject ?? null;
                if ($subject) {
                    $decoded = imap_mime_header_decode($subject);
                    $subject = implode('', array_map(fn ($p) => $p->text, $decoded));
                }

                $receivedAt = isset($header->udate) ? Carbon::createFromTimestamp($header->udate) : now();

                $parsedMessages[] = [
                    'message_id_remote' => $remoteId,
                    'message_id_header' => $messageIdHeader,
                    'uid' => $uid,
                    'subject' => $subject,
                    'body_html' => $bodyHtml,
                    'body_text' => $bodyText,
                    'from_address' => $fromAddress,
                    'from_name' => $fromName,
                    'to_recipients' => $to,
                    'cc_recipients' => $cc ?: null,
                    'received_at' => $receivedAt,
                    'is_read' => ! ($header->unseen ?? false),
                    'is_flagged' => ($header->flagged ?? false),
                    'in_reply_to' => $header->in_reply_to ?? null,
                    'references' => isset($header->references) ? array_map('trim', explode(' ', $header->references)) : null,
                ];

                if ($uid > $maxUid) {
                    $maxUid = $uid;
                }
            }

            return [
                'messages' => $parsedMessages,
                'next_cursor' => (string) $maxUid,
            ];
        } finally {
            imap_close($inbox);
        }
    }

    private function fetchViaSocketImap(EmailAccount $account, EmailFolder $folder, ?string $cursor, string $host, int $port, string $password, string $encryption): array
    {
        $stream = $this->connectSocket($host, $port, $encryption);
        if (! $stream) {
            return ['messages' => [], 'next_cursor' => $cursor];
        }

        try {
            $loginRes = $this->sendSocketCommand($stream, 'LOGIN "'.$account->email.'" "'.$this->escapeImapString($password).'"');
            if (! str_contains(strtoupper($loginRes), 'OK')) {
                fclose($stream);

                return ['messages' => [], 'next_cursor' => $cursor];
            }

            $selectRes = $this->sendSocketCommand($stream, 'SELECT "'.$folder->remote_id.'"');
            if (! str_contains(strtoupper($selectRes), 'OK')) {
                $candidates = $this->getAlternateRemoteIds($folder);
                $selected = false;
                foreach ($candidates as $cand) {
                    $selectRes = $this->sendSocketCommand($stream, 'SELECT "'.$cand.'"');
                    if (str_contains(strtoupper($selectRes), 'OK')) {
                        $selected = true;
                        $folder->update(['remote_id' => $cand]);
                        break;
                    }
                }
                if (! $selected) {
                    fclose($stream);

                    return ['messages' => [], 'next_cursor' => $cursor];
                }
            }

            $lastUid = ($cursor !== null && $cursor !== '' && $cursor !== '0' && is_numeric($cursor)) ? (int) $cursor : 0;
            $searchCmd = $lastUid > 0 ? 'UID SEARCH UID '.($lastUid + 1).':*' : 'UID SEARCH ALL';
            $searchRes = $this->sendSocketCommand($stream, $searchCmd);

            $uids = [];
            if (preg_match('/\* SEARCH ([\d\s]+)/i', $searchRes, $matches)) {
                $uids = array_filter(explode(' ', trim($matches[1])));
            }

            sort($uids);
            $uids = array_slice($uids, 0, 250); // fetch up to 250 unsynced messages
            $maxUid = $lastUid;
            $parsedMessages = [];

            foreach ($uids as $uid) {
                $uidInt = (int) $uid;
                if ($uidInt <= 0) {
                    continue;
                }

                $fetchRes = $this->sendSocketCommand($stream, "UID FETCH {$uidInt} (BODY.PEEK[])");
                $remoteId = "imap-uid-{$uidInt}";
                $parsed = $this->parseRawRfc822Message($fetchRes, $uidInt, $remoteId, $host, $account->email);
                if ($parsed) {
                    $parsedMessages[] = $parsed;
                    if ($uidInt > $maxUid) {
                        $maxUid = $uidInt;
                    }
                }
            }

            $this->sendSocketCommand($stream, 'LOGOUT');
            fclose($stream);

            return [
                'messages' => $parsedMessages,
                'next_cursor' => (string) $maxUid,
            ];
        } catch (\Throwable $e) {
            if (is_resource($stream)) {
                fclose($stream);
            }
            Log::error('Socket IMAP fetch error', ['error' => $e->getMessage()]);

            return ['messages' => [], 'next_cursor' => $cursor];
        }
    }

    private function parseRawRfc822Message(string $rawMessage, int $uid, string $remoteId, string $host, string $accountEmail): array
    {
        $parts = preg_split('/\r?\n\r?\n/', $rawMessage, 2);
        $headerBlock = $parts[0] ?? '';
        $bodyBlock = $parts[1] ?? '';

        $unfoldedHeaders = preg_replace('/\r?\n[ \t]+/', ' ', $headerBlock);
        $headerLines = explode("\n", str_replace("\r", '', $unfoldedHeaders));

        $headers = [];
        foreach ($headerLines as $line) {
            if (str_contains($line, ':')) {
                [$name, $val] = explode(':', $line, 2);
                $headers[strtolower(trim($name))] = trim($val);
            }
        }

        $subject = isset($headers['subject']) ? $this->decodeMimeHeader($headers['subject']) : null;
        $fromRaw = $headers['from'] ?? '';
        $fromAddress = '';
        $fromName = null;

        if ($fromRaw) {
            if (preg_match('/^(.*?)\s*<([^>]+)>/', $fromRaw, $m)) {
                $fromName = trim($this->decodeMimeHeader($m[1]), '" ');
                $fromAddress = trim($m[2]);
            } else {
                $fromAddress = trim($fromRaw, '<> ');
            }
        }

        $toRecipients = ! empty($headers['to']) ? $this->extractEmailAddresses($headers['to']) : [];
        $ccRecipients = ! empty($headers['cc']) ? $this->extractEmailAddresses($headers['cc']) : [];

        $messageIdHeader = $headers['message-id'] ?? "<{$remoteId}@{$host}>";
        $inReplyTo = $headers['in-reply-to'] ?? null;
        $references = $headers['references'] ?? null;

        $receivedAt = now();
        if (! empty($headers['date'])) {
            try {
                $receivedAt = Carbon::parse($headers['date']);
            } catch (\Throwable) {
                $receivedAt = now();
            }
        }

        $contentType = $headers['content-type'] ?? 'text/plain';
        $transferEncoding = $headers['content-transfer-encoding'] ?? '';
        $bodyText = null;
        $bodyHtml = null;

        if (preg_match('/multipart\//i', $contentType) && preg_match('/boundary="?([^";]+)"?/i', $contentType, $m)) {
            $boundary = $m[1];
            $subParts = explode('--'.$boundary, $bodyBlock);
            foreach ($subParts as $sub) {
                if (trim($sub) === '' || str_starts_with(trim($sub), '--')) {
                    continue;
                }
                $this->parseMimePart($sub, $bodyText, $bodyHtml);
            }
        } else {
            $decoded = $this->decodeTransferEncoding($bodyBlock, $transferEncoding);
            if (preg_match('/text\/html/i', $contentType)) {
                $bodyHtml = $decoded;
            } else {
                $bodyText = $decoded;
            }
        }

        return [
            'message_id_remote' => $remoteId,
            'message_id_header' => $messageIdHeader,
            'uid' => $uid,
            'subject' => $this->cleanUtf8($subject),
            'body_html' => $this->cleanUtf8($bodyHtml),
            'body_text' => $this->cleanUtf8($bodyText),
            'from_address' => $fromAddress ?: $accountEmail,
            'from_name' => $this->cleanUtf8($fromName),
            'to_recipients' => $toRecipients,
            'cc_recipients' => $ccRecipients ?: null,
            'received_at' => $receivedAt,
            'is_read' => true,
            'is_flagged' => false,
            'in_reply_to' => $inReplyTo,
            'references' => $references,
        ];
    }

    private function cleanUtf8(?string $str): ?string
    {
        if ($str === null) {
            return null;
        }

        return mb_convert_encoding($str, 'UTF-8', 'UTF-8');
    }

    private function parseMimePart(string $rawPart, ?string &$bodyText, ?string &$bodyHtml): void
    {
        $parts = preg_split('/\r?\n\r?\n/', $rawPart, 2);
        $headerBlock = $parts[0] ?? '';
        $contentBlock = $parts[1] ?? '';

        $unfolded = preg_replace('/\r?\n[ \t]+/', ' ', $headerBlock);
        $lines = explode("\n", str_replace("\r", '', $unfolded));
        $headers = [];
        foreach ($lines as $line) {
            if (str_contains($line, ':')) {
                [$k, $v] = explode(':', $line, 2);
                $headers[strtolower(trim($k))] = trim($v);
            }
        }

        $cType = $headers['content-type'] ?? 'text/plain';
        $transfer = $headers['content-transfer-encoding'] ?? '';
        $decoded = $this->decodeTransferEncoding($contentBlock, $transfer);

        if (preg_match('/multipart\//i', $cType) && preg_match('/boundary="?([^";]+)"?/i', $cType, $m)) {
            $boundary = $m[1];
            $subParts = explode('--'.$boundary, $decoded);
            foreach ($subParts as $sub) {
                if (trim($sub) === '' || str_starts_with(trim($sub), '--')) {
                    continue;
                }
                $this->parseMimePart($sub, $bodyText, $bodyHtml);
            }
        } else {
            if (preg_match('/text\/html/i', $cType)) {
                if (! $bodyHtml) {
                    $bodyHtml = $decoded;
                }
            } elseif (preg_match('/text\/plain/i', $cType)) {
                if (! $bodyText) {
                    $bodyText = $decoded;
                }
            }
        }
    }

    private function decodeTransferEncoding(string $body, string $encoding): string
    {
        $encoding = strtolower(trim($encoding));
        if ($encoding === 'base64') {
            return base64_decode(preg_replace('/\s+/', '', $body));
        }
        if ($encoding === 'quoted-printable') {
            return quoted_printable_decode($body);
        }

        return $body;
    }

    private function decodeMimeHeader(string $str): string
    {
        if (function_exists('mb_decode_mimeheader')) {
            return mb_decode_mimeheader($str);
        }
        if (function_exists('iconv_mime_decode')) {
            return iconv_mime_decode($str, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');
        }

        return $str;
    }

    private function extractEmailAddresses(string $str): array
    {
        preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $str, $matches);

        return array_values(array_unique($matches[0] ?? []));
    }

    private function connectSocket(string $host, int $port, string $encryption)
    {
        $prefix = ($encryption === 'ssl') ? 'ssl://' : '';
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
            ],
        ]);

        $stream = @stream_socket_client($prefix.$host.':'.$port, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
        if ($stream) {
            stream_set_timeout($stream, 15);
            fgets($stream, 512); // read banner
        }

        return $stream;
    }

    private function sendSocketCommand($stream, string $command): string
    {
        static $tagCount = 0;
        $tagCount++;
        $tag = 'A'.str_pad((string) $tagCount, 4, '0', STR_PAD_LEFT);

        fwrite($stream, "{$tag} {$command}\r\n");

        $buffer = '';
        while (! feof($stream)) {
            $line = fgets($stream, 8192);
            $buffer .= $line;
            if (preg_match('/^'.$tag.'\s+(OK|NO|BAD)/i', $line)) {
                break;
            }
        }

        return $buffer;
    }

    private function escapeImapString(string $str): string
    {
        return str_replace(['\\', '"'], ['\\\\', '\"'], $str);
    }

    private function extractExtImapBody($inbox, int $msgNum, \stdClass $structure, ?string &$bodyText, ?string &$bodyHtml): void
    {
        if ($structure->type === 0) {
            $body = imap_fetchbody($inbox, $msgNum, 1);
            if ($structure->subtype === 'HTML') {
                $bodyHtml = $body;
            } else {
                $bodyText = $body;
            }
        } elseif (isset($structure->parts)) {
            foreach ($structure->parts as $partNum => $part) {
                if ($part->type === 0) {
                    $body = imap_fetchbody($inbox, $msgNum, $partNum + 1);
                    if (($part->subtype ?? '') === 'HTML') {
                        $bodyHtml = $body;
                    } else {
                        $bodyText = $body;
                    }
                }
            }
        }
    }

    private function getAlternateRemoteIds(EmailFolder $folder): array
    {
        $type = strtolower($folder->type ?? '');
        $remote = $folder->remote_id;

        $candidates = [];

        if ($type === 'sent') {
            $candidates = ['INBOX.Sent', 'Sent', 'Sent Messages', 'Sent Items', 'INBOX/Sent', 'INBOX.Sent Items', 'INBOX.Sent Messages'];
        } elseif ($type === 'drafts') {
            $candidates = ['INBOX.Drafts', 'Drafts', 'INBOX/Drafts', 'Draft'];
        } elseif ($type === 'trash') {
            $candidates = ['INBOX.Trash', 'Trash', 'Deleted Items', 'Deleted Messages', 'INBOX/Trash', 'INBOX.Deleted Items'];
        } elseif ($type === 'spam') {
            $candidates = ['INBOX.Junk', 'Junk', 'INBOX.Spam', 'Spam', 'Junk E-mail', 'INBOX/Spam', 'INBOX/Junk'];
        } elseif ($type === 'inbox') {
            $candidates = ['INBOX', 'Inbox'];
        }

        return array_values(array_filter($candidates, fn ($c) => $c !== $remote));
    }
}
