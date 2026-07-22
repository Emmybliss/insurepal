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

        $selectedAccountId = $request->integer('account_id') ?: null;
        $selectedFolderId = $request->integer('folder_id') ?: null;

        $foldersQuery = EmailFolder::whereHas('account', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        });

        if ($selectedAccountId) {
            $foldersQuery->where('account_id', $selectedAccountId);
        }

        $folders = $foldersQuery->withCount('messages')->get();

        $messagesQuery = EmailMessage::whereHas('account', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->with(['account:id,email,account_name', 'folder:id,name,type']);

        if ($selectedAccountId) {
            $messagesQuery->where('account_id', $selectedAccountId);
        }

        if ($selectedFolderId) {
            $messagesQuery->where('folder_id', $selectedFolderId);
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
            'selectedAccountId' => $selectedAccountId,
        ]);
    }
}
