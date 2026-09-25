<?php

namespace App\Http\Controllers;

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Models\EmailMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmailInboxController extends Controller
{
    public function __invoke(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $accounts = EmailAccount::where('tenant_id', $tenantId)
            ->withCount(['messages', 'folders'])
            ->get();

        // Ensure standard folders exist for all connected accounts
        $standardFolders = [
            ['name' => 'INBOX', 'remote_id' => 'INBOX', 'type' => 'inbox'],
            ['name' => 'Sent', 'remote_id' => 'Sent', 'type' => 'sent'],
            ['name' => 'Drafts', 'remote_id' => 'Drafts', 'type' => 'drafts'],
            ['name' => 'Trash', 'remote_id' => 'Trash', 'type' => 'trash'],
            ['name' => 'Spam', 'remote_id' => 'Junk', 'type' => 'spam'],
        ];

        foreach ($accounts as $acc) {
            foreach ($standardFolders as $sf) {
                $acc->folders()->firstOrCreate(
                    ['type' => $sf['type']],
                    ['name' => $sf['name'], 'remote_id' => $sf['remote_id']]
                );
            }
        }

        $selectedAccountId = $request->integer('account_id') ?: null;
        $selectedFolderId = $request->integer('folder_id') ?: null;
        $selectedFolderType = $request->input('folder_type') ?: null;

        $foldersQuery = EmailFolder::whereHas('account', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        });

        if ($selectedAccountId) {
            $foldersQuery->where('account_id', $selectedAccountId);
        }

        $folders = $foldersQuery->withCount('messages')->get();

        // Default folder_type to 'inbox' if no specific folder_id or folder_type was requested
        if (! $selectedFolderId && ! $selectedFolderType) {
            $selectedFolderType = 'inbox';
        }

        $messagesQuery = EmailMessage::whereHas('account', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->with(['account:id,email,account_name', 'folder:id,name,type']);

        if ($selectedAccountId) {
            $messagesQuery->where('account_id', $selectedAccountId);
        }

        if ($selectedFolderId) {
            $messagesQuery->where('folder_id', $selectedFolderId);
        } elseif ($selectedFolderType) {
            $messagesQuery->whereHas('folder', function ($q) use ($selectedFolderType) {
                $q->where('type', $selectedFolderType);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $messagesQuery->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('from_address', 'like', "%{$search}%")
                    ->orWhere('body_text', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('unread')) {
            $messagesQuery->unread();
        }

        $messages = $messagesQuery->orderBy('received_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return Inertia::render('email/inbox', [
            'accounts' => $accounts,
            'folders' => $folders,
            'messages' => $messages->items(),
            'selectedFolderId' => $selectedFolderId,
            'selectedFolderType' => $selectedFolderType,
            'selectedAccountId' => $selectedAccountId,
        ]);
    }
}
