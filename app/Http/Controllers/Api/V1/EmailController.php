<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmailAccount;
use App\Models\EmailAttachment;
use App\Models\EmailFolder;
use App\Models\EmailMessage;
use App\Models\EmailSignature;
use App\Models\EmailTemplate;
use App\Models\EmailThread;
use App\Services\Email\EmailProviderFactory;
use App\Services\Email\EmailSendService;
use App\Services\Email\EmailSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmailController extends Controller
{
    public function __construct(
        private EmailSyncService $emailSyncService,
        private EmailSendService $emailSendService,
        private EmailProviderFactory $providerFactory,
    ) {}

    public function accounts(Request $request): JsonResponse
    {
        $accounts = EmailAccount::where('tenant_id', $request->user()->tenant_id)
            ->withCount(['messages', 'folders', 'threads'])
            ->get();

        return response()->json(['success' => true, 'data' => $accounts]);
    }

    public function storeAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|in:gmail,microsoft365,imap,smtp',
            'email' => 'required|email',
            'account_name' => 'nullable|string|max:255',
            'imap_host' => 'required_if:provider,imap|nullable|string',
            'imap_port' => 'required_if:provider,imap|nullable|string',
            'imap_encryption' => 'nullable|string|in:ssl,tls,starttls,none',
            'smtp_host' => 'required_if:provider,imap,smtp|nullable|string',
            'smtp_port' => 'required_if:provider,imap,smtp|nullable|string',
            'smtp_encryption' => 'nullable|string|in:ssl,tls,starttls,none',
            'password' => 'required_if:provider,smtp,imap|nullable|string',
        ]);

        $data = $validated;
        if (! empty($data['password'])) {
            $data['credentials_encrypted'] = Crypt::encryptString($data['password']);
        }
        unset($data['password']);

        $data['tenant_id'] = $request->user()->tenant_id;
        $data['sync_status'] = 'idle';

        $account = EmailAccount::create($data);

        // Test connection immediately for IMAP/SMTP
        if (in_array($account->provider, ['imap', 'smtp'])) {
            $testRes = $this->providerFactory->make($account)->testConnection($account);
            $account->update([
                'test_status' => $testRes['success'] ? 'success' : 'failed',
                'test_error' => $testRes['error'],
            ]);
        }

        if (in_array($account->provider, ['gmail', 'microsoft365', 'imap'])) {
            dispatch(new \App\Jobs\SyncEmailAccount(emailAccount: $account));
        }

        return response()->json([
            'success' => true,
            'message' => 'Account connected.',
            'data' => $account,
        ]);
    }

    public function updateAccount(Request $request, EmailAccount $account): JsonResponse
    {
        $this->authorizeTenant($request, $account);

        $validated = $request->validate([
            'account_name' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'imap_host' => 'nullable|string',
            'imap_port' => 'nullable|string',
            'imap_encryption' => 'nullable|string|in:ssl,tls,starttls,none',
            'smtp_host' => 'nullable|string',
            'smtp_port' => 'nullable|string',
            'smtp_encryption' => 'nullable|string|in:ssl,tls,starttls,none',
            'password' => 'nullable|string',
            'is_system_default' => 'nullable|boolean',
        ]);

        if (! empty($validated['password'])) {
            $validated['credentials_encrypted'] = Crypt::encryptString($validated['password']);
        }
        unset($validated['password']);

        if (! empty($validated['is_system_default'])) {
            EmailAccount::where('tenant_id', $account->tenant_id)
                ->where('is_system_default', true)
                ->where('id', '!=', $account->id)
                ->update(['is_system_default' => false]);
        }

        $account->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Account updated.',
            'data' => $account->fresh(),
        ]);
    }

    public function testAccountConnection(Request $request, EmailAccount $account): JsonResponse
    {
        $this->authorizeTenant($request, $account);
        $provider = $this->providerFactory->make($account);
        $result = $provider->testConnection($account);

        $account->update([
            'test_status' => $result['success'] ? 'success' : 'failed',
            'test_error' => $result['error'],
        ]);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Connection successful.' : ($result['error'] ?: 'Connection failed.'),
            'error' => $result['error'],
        ]);
    }

    public function testUnsavedCredentials(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|in:imap,smtp',
            'email' => 'required|email',
            'imap_host' => 'required_if:provider,imap|nullable|string',
            'imap_port' => 'required_if:provider,imap|nullable|string',
            'imap_encryption' => 'nullable|string|in:ssl,tls,starttls,none',
            'smtp_host' => 'required_if:provider,imap,smtp|nullable|string',
            'smtp_port' => 'required_if:provider,imap,smtp|nullable|string',
            'smtp_encryption' => 'nullable|string|in:ssl,tls,starttls,none',
            'password' => 'required|string',
        ]);

        $dummyAccount = new EmailAccount([
            'tenant_id' => $request->user()->tenant_id,
            'provider' => $validated['provider'],
            'email' => $validated['email'],
            'imap_host' => $validated['imap_host'] ?? null,
            'imap_port' => $validated['imap_port'] ?? null,
            'imap_encryption' => $validated['imap_encryption'] ?? null,
            'smtp_host' => $validated['smtp_host'] ?? null,
            'smtp_port' => $validated['smtp_port'] ?? null,
            'smtp_encryption' => $validated['smtp_encryption'] ?? null,
            'credentials_encrypted' => Crypt::encryptString($validated['password']),
        ]);

        $provider = $this->providerFactory->make($dummyAccount);
        $result = $provider->testConnection($dummyAccount);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Test connection successful!' : ($result['error'] ?: 'Connection test failed.'),
            'error' => $result['error'],
        ]);
    }

    public function showAccount(Request $request, EmailAccount $account): JsonResponse
    {
        $this->authorizeTenant($request, $account);
        $account->load(['folders', 'signatures']);

        return response()->json(['success' => true, 'data' => $account]);
    }

    public function deleteAccount(Request $request, EmailAccount $account): JsonResponse
    {
        $this->authorizeTenant($request, $account);
        $account->delete();

        return response()->json(['success' => true, 'message' => 'Account disconnected']);
    }

    public function syncAccount(Request $request, EmailAccount $account): JsonResponse
    {
        $this->authorizeTenant($request, $account);
        dispatch(new \App\Jobs\SyncEmailAccount(emailAccount: $account));

        return response()->json(['success' => true, 'message' => 'Sync queued']);
    }

    public function folders(Request $request, EmailAccount $account): JsonResponse
    {
        $this->authorizeTenant($request, $account);
        $folders = $account->folders()->withCount('messages')->get();

        return response()->json(['success' => true, 'data' => $folders]);
    }

    public function threads(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $query = EmailThread::where('tenant_id', $tenantId)
            ->with([
                'account:id,email,account_name,provider',
                'customer:id,first_name,last_name,email,phone',
                'policy:id,policy_number,status',
                'claim:id,claim_number,status',
                'latestMessage.attachments',
            ]);

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', '!=', 'trash');
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('policy_id')) {
            $query->where('policy_id', $request->policy_id);
        }

        if ($request->filled('claim_id')) {
            $query->where('claim_id', $request->claim_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('participant_addresses', 'like', "%{$search}%")
                    ->orWhereHas('messages', function ($mq) use ($search) {
                        $mq->where('body_text', 'like', "%{$search}%")
                            ->orWhere('from_address', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->boolean('unread')) {
            $query->unread();
        }

        $threads = $query->orderBy('last_message_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $threads->items(),
            'meta' => [
                'current_page' => $threads->currentPage(),
                'per_page' => $threads->perPage(),
                'total' => $threads->total(),
                'last_page' => $threads->lastPage(),
            ],
        ]);
    }

    public function showThread(Request $request, EmailThread $thread): JsonResponse
    {
        if ($thread->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Unauthorized access to email thread.');
        }

        $thread->load([
            'account:id,email,account_name,provider',
            'customer:id,first_name,last_name,email,phone',
            'policy:id,policy_number,status',
            'claim:id,claim_number,status',
            'messages.attachments',
            'messages.account:id,email,account_name',
        ]);

        if ($thread->is_unread) {
            $thread->update(['is_unread' => false]);
            EmailMessage::where('email_thread_id', $thread->id)->update(['is_read' => true]);
        }

        return response()->json(['success' => true, 'data' => $thread]);
    }

    public function messages(Request $request): JsonResponse
    {
        $query = EmailMessage::whereHas('account', function ($q) use ($request) {
            $q->where('tenant_id', $request->user()->tenant_id);
        })->with(['account:id,email,account_name', 'folder:id,name,type', 'attachments']);

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->filled('folder_id')) {
            $query->where('folder_id', $request->folder_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('from_address', 'like', "%{$search}%")
                    ->orWhere('body_text', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('unread')) {
            $query->unread();
        }

        $messages = $query->orderBy('received_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
                'last_page' => $messages->lastPage(),
            ],
        ]);
    }

    public function showMessage(Request $request, EmailMessage $message): JsonResponse
    {
        $this->authorizeTenant($request, $message);
        $message->load(['account:id,email,account_name', 'folder', 'attachments', 'customer', 'policy', 'claim']);

        if (! $message->is_read) {
            $message->update(['is_read' => true]);
        }

        return response()->json(['success' => true, 'data' => $message]);
    }

    public function markRead(Request $request, EmailMessage $message): JsonResponse
    {
        $this->authorizeTenant($request, $message);
        $message->update(['is_read' => $request->boolean('read', true)]);

        return response()->json(['success' => true, 'message' => 'Updated']);
    }

    public function toggleFlag(Request $request, EmailMessage $message): JsonResponse
    {
        $this->authorizeTenant($request, $message);
        $message->update(['is_flagged' => ! $message->is_flagged]);

        return response()->json(['success' => true, 'message' => 'Updated']);
    }

    public function moveMessage(Request $request, EmailMessage $message): JsonResponse
    {
        $this->authorizeTenant($request, $message);
        $validated = $request->validate([
            'folder_id' => 'required|exists:email_folders,id',
        ]);

        $folder = EmailFolder::where('account_id', $message->account_id)->findOrFail($validated['folder_id']);
        $message->update(['folder_id' => $folder->id]);

        return response()->json(['success' => true, 'message' => 'Message moved']);
    }

    public function batchMessages(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message_ids' => 'required|array',
            'message_ids.*' => 'integer',
            'action' => 'required|string|in:read,unread,mark_read,mark_unread,flag,unflag,delete',
        ]);

        $query = EmailMessage::whereHas('account', function ($q) use ($request) {
            $q->where('tenant_id', $request->user()->tenant_id);
        })->whereIn('id', $validated['message_ids']);

        match ($validated['action']) {
            'read', 'mark_read' => $query->update(['is_read' => true]),
            'unread', 'mark_unread' => $query->update(['is_read' => false]),
            'flag' => $query->update(['is_flagged' => true]),
            'unflag' => $query->update(['is_flagged' => false]),
            'delete' => $query->delete(),
        };

        return response()->json(['success' => true, 'message' => 'Batch operation completed']);
    }

    public function compose(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:email_accounts,id',
            'to' => 'required|string',
            'cc' => 'nullable|string',
            'bcc' => 'nullable|string',
            'subject' => 'required|string|max:998',
            'body_html' => 'required|string',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|max:20480',
            'document_paths' => 'nullable|array|max:10',
            'document_paths.*' => 'string',
        ]);

        $account = EmailAccount::findOrFail($validated['account_id']);
        $this->authorizeTenant($request, $account);

        $attachmentPayloads = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('email-compose-temp', 'local');
                $attachmentPayloads[] = [
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType() ?? 'application/octet-stream',
                    'path' => $path,
                    'temp' => true,
                ];
            }
        }

        if (! empty($validated['document_paths'])) {
            foreach ($validated['document_paths'] as $docPath) {
                if (Storage::disk('public')->exists($docPath)) {
                    $attachmentPayloads[] = [
                        'name' => basename($docPath),
                        'mime' => Storage::disk('public')->mimeType($docPath) ?? 'application/octet-stream',
                        'path' => $docPath,
                        'disk' => 'public',
                        'temp' => false,
                    ];
                }
            }
        }

        $result = $this->emailSendService->send(
            $account,
            $validated['to'],
            $validated['subject'],
            strip_tags($validated['body_html']),
            $validated['body_html'],
            $attachmentPayloads,
            $validated['cc'] ?? null,
            $validated['bcc'] ?? null
        );

        foreach ($attachmentPayloads as $att) {
            if (! empty($att['temp'])) {
                Storage::disk('local')->delete($att['path']);
            }
        }

        return response()->json($result);
    }

    public function replyMessage(Request $request, EmailMessage $message): JsonResponse
    {
        $this->authorizeTenant($request, $message);
        $validated = $request->validate([
            'body' => 'required|string',
            'reply_all' => 'boolean',
        ]);

        $attachmentPayloads = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('email-compose-temp', 'local');
                $attachmentPayloads[] = [
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType() ?? 'application/octet-stream',
                    'path' => $path,
                    'temp' => true,
                ];
            }
        }

        $result = $this->emailSendService->reply(
            $message,
            $validated['body'],
            $validated['reply_all'] ?? false,
            $attachmentPayloads
        );

        foreach ($attachmentPayloads as $att) {
            if (! empty($att['temp'])) {
                Storage::disk('local')->delete($att['path']);
            }
        }

        return response()->json($result);
    }

    public function forwardMessage(Request $request, EmailMessage $message): JsonResponse
    {
        $this->authorizeTenant($request, $message);
        $validated = $request->validate([
            'to' => 'required|string',
            'body' => 'required|string',
        ]);

        $attachmentPayloads = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('email-compose-temp', 'local');
                $attachmentPayloads[] = [
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType() ?? 'application/octet-stream',
                    'path' => $path,
                    'temp' => true,
                ];
            }
        }

        $result = $this->emailSendService->forward(
            $message,
            $validated['body'],
            explode(',', $validated['to']),
            $attachmentPayloads
        );

        foreach ($attachmentPayloads as $att) {
            if (! empty($att['temp'])) {
                Storage::disk('local')->delete($att['path']);
            }
        }

        return response()->json($result);
    }

    public function signatures(Request $request): JsonResponse
    {
        $signatures = EmailSignature::whereHas('account', function ($q) use ($request) {
            $q->where('tenant_id', $request->user()->tenant_id);
        })->get();

        return response()->json(['success' => true, 'data' => $signatures]);
    }

    public function storeSignature(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:email_accounts,id',
            'name' => 'required|string|max:255',
            'body_html' => 'required|string',
            'is_default' => 'boolean',
        ]);

        $account = EmailAccount::where('tenant_id', $request->user()->tenant_id)->findOrFail($validated['account_id']);

        if (! empty($validated['is_default'])) {
            EmailSignature::where('account_id', $account->id)->update(['is_default' => false]);
        }

        $signature = EmailSignature::create([
            'account_id' => $account->id,
            'name' => $validated['name'],
            'body_html' => $validated['body_html'],
            'is_default' => $validated['is_default'] ?? false,
        ]);

        return response()->json(['success' => true, 'data' => $signature]);
    }

    public function deleteSignature(Request $request, EmailSignature $signature): JsonResponse
    {
        $this->authorizeTenant($request, $signature->account);
        $signature->delete();

        return response()->json(['success' => true, 'message' => 'Signature deleted']);
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $searchTerm = $request->input('query');

        $query = EmailMessage::whereHas('account', function ($q) use ($request) {
            $q->where('tenant_id', $request->user()->tenant_id);
        })->with(['account:id,email,account_name', 'folder:id,name,type', 'attachments']);

        $query->where(function ($q) use ($searchTerm) {
            $q->where('subject', 'like', "%{$searchTerm}%")
                ->orWhere('from_address', 'like', "%{$searchTerm}%")
                ->orWhere('from_name', 'like', "%{$searchTerm}%")
                ->orWhere('body_text', 'like', "%{$searchTerm}%");
        });

        $messages = $query->orderBy('received_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
                'last_page' => $messages->lastPage(),
            ],
        ]);
    }

    public function templates(Request $request): JsonResponse
    {
        $templates = EmailTemplate::where('tenant_id', $request->user()->tenant_id)->get();

        return response()->json(['success' => true, 'data' => $templates]);
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body_html' => 'required|string',
        ]);

        $template = EmailTemplate::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $validated['name'],
            'subject' => $validated['subject'],
            'body_html' => $validated['body_html'],
        ]);

        return response()->json(['success' => true, 'data' => $template]);
    }

    public function updateTemplate(Request $request, EmailTemplate $template): JsonResponse
    {
        $this->authorizeTenant($request, $template);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string|max:255',
            'body_html' => 'sometimes|string',
        ]);

        $template->update($validated);

        return response()->json(['success' => true, 'data' => $template]);
    }

    public function deleteTemplate(Request $request, EmailTemplate $template): JsonResponse
    {
        $this->authorizeTenant($request, $template);
        $template->delete();

        return response()->json(['success' => true, 'message' => 'Template deleted']);
    }

    public function downloadAttachment(Request $request, EmailAttachment $attachment): StreamedResponse
    {
        $this->authorizeTenant($request, $attachment->message);

        $disk = Storage::disk('local');
        abort_unless($disk->exists($attachment->storage_path), 404, 'Attachment not found.');

        return $disk->download($attachment->storage_path, $attachment->filename, [
            'Content-Type' => $attachment->mime_type ?? 'application/octet-stream',
        ]);
    }

    private function authorizeTenant(Request $request, $model): void
    {
        if ($model instanceof EmailMessage) {
            $account = $model->account;
            if (! $account || $account->tenant_id !== $request->user()->tenant_id) {
                abort(403, 'Unauthorized');
            }
        } elseif (isset($model->tenant_id) && $model->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Unauthorized');
        }
    }
}
