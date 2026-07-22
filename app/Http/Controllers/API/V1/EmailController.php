<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmailAccount;
use App\Models\EmailAttachment;
use App\Models\EmailMessage;
use App\Models\EmailSignature;
use App\Models\EmailTemplate;
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
    ) {}

    public function accounts(Request $request): JsonResponse
    {
        $accounts = EmailAccount::where('tenant_id', $request->user()->tenant_id)
            ->withCount(['messages', 'folders'])
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
            'smtp_host' => 'required_if:provider,imap,smtp|nullable|string',
            'smtp_port' => 'required_if:provider,imap,smtp|nullable|string',
            'password' => 'required_if:provider,smtp|nullable|string',
        ]);

        $data = $validated;

        if (! empty($data['password'])) {
            $data['credentials_encrypted'] = Crypt::encryptString($data['password']);
        }
        unset($data['password']);

        $data['tenant_id'] = $request->user()->tenant_id;

        $account = EmailAccount::create($data);

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
            'smtp_host' => 'nullable|string',
            'smtp_port' => 'nullable|string',
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

    public function messages(Request $request): JsonResponse
    {
        $query = EmailMessage::whereHas('account', function ($q) use ($request) {
            $q->where('tenant_id', $request->user()->tenant_id);
        })->with(['account:id,email,account_name', 'folder:id,name,type']);

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
        $message->load(['account:id,email,account_name', 'folder', 'attachments']);

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
        $validated = $request->validate(['folder_id' => 'required|exists:email_folders,id']);
        $message->update(['folder_id' => $validated['folder_id']]);

        return response()->json(['success' => true, 'message' => 'Moved']);
    }

    public function batchMessages(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message_ids' => 'required|array',
            'message_ids.*' => 'integer|exists:email_messages,id',
            'action' => 'required|in:delete,move,mark_read,mark_unread',
            'folder_id' => 'required_if:action,move|integer|exists:email_folders,id',
        ]);

        $messages = EmailMessage::whereIn('id', $validated['message_ids'])->get();

        foreach ($messages as $message) {
            match ($validated['action']) {
                'delete' => $message->delete(),
                'move' => $message->update(['folder_id' => $validated['folder_id']]),
                'mark_read' => $message->update(['is_read' => true]),
                'mark_unread' => $message->update(['is_read' => false]),
            };
        }

        return response()->json(['success' => true, 'message' => 'Batch action completed']);
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
            'attachments.*' => 'file|max:20480', // 20 MB per file
            'document_paths' => 'nullable|array|max:10',
            'document_paths.*' => 'string',
        ]);

        $account = EmailAccount::findOrFail($validated['account_id']);
        $this->authorizeTenant($request, $account);

        // Build attachment payloads — uploaded files
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

        // InsurePal document attachments (files from public storage)
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
            $validated['bcc'] ?? null,
        );

        // Clean up temp files after send
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

        // Build attachment payloads for reply
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
            $attachmentPayloads,
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
            $attachmentPayloads,
        );

        foreach ($attachmentPayloads as $att) {
            if (! empty($att['temp'])) {
                Storage::disk('local')->delete($att['path']);
            }
        }

        return response()->json($result);
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

        $signature = EmailSignature::create($validated);

        return response()->json(['success' => true, 'data' => $signature]);
    }

    public function deleteSignature(Request $request, EmailSignature $signature): JsonResponse
    {
        $this->authorizeTenant($request, $signature);
        $signature->delete();

        return response()->json(['success' => true, 'message' => 'Deleted']);
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
            'subject' => 'required|string|max:998',
            'body_html' => 'required|string',
            'category' => 'nullable|string|max:100',
        ]);

        $template = EmailTemplate::create(array_merge(
            $validated,
            ['tenant_id' => $request->user()->tenant_id],
        ));

        return response()->json(['success' => true, 'data' => $template]);
    }

    public function updateTemplate(Request $request, EmailTemplate $template): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:998',
            'body_html' => 'required|string',
            'category' => 'nullable|string|max:100',
        ]);

        $template->update($validated);

        return response()->json(['success' => true, 'data' => $template]);
    }

    public function deleteTemplate(Request $request, EmailTemplate $template): JsonResponse
    {
        $template->delete();

        return response()->json(['success' => true, 'message' => 'Deleted']);
    }

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:200',
            'account_id' => 'nullable|exists:email_accounts,id',
        ]);

        $query = EmailMessage::whereHas('account', function ($q) use ($request) {
            $q->where('tenant_id', $request->user()->tenant_id);
        });

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        $search = $validated['query'];
        $results = $query->where(function ($q) use ($search) {
            $q->where('subject', 'like', "%{$search}%")
                ->orWhere('from_address', 'like', "%{$search}%")
                ->orWhere('from_name', 'like', "%{$search}%")
                ->orWhere('body_text', 'like', "%{$search}%");
        })->orderBy('received_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $results->items(),
            'meta' => [
                'current_page' => $results->currentPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'last_page' => $results->lastPage(),
            ],
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
