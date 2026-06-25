<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Requests\MessageRequest;
use App\Models\Customer;
use App\Models\Message;
use App\Models\MessageRecipient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $folder = $request->get('folder', 'inbox');

        $query = Message::query()
            ->with(['sender', 'messageRecipients.recipient'])
            ->latest();

        // Filter by folder
        switch ($folder) {
            case 'inbox':
                $query->whereHas('messageRecipients', function ($q) use ($user) {
                    $q->where('recipient_id', $user->id)
                        ->whereNull('deleted_at');
                });
                break;

            case 'sent':
                $query->where('sender_id', $user->id)
                    ->whereNotNull('sent_at');
                break;

            case 'drafts':
                $query->where('sender_id', $user->id)
                    ->whereNull('sent_at');
                break;

            case 'unread':
                $query->whereHas('messageRecipients', function ($q) use ($user) {
                    $q->where('recipient_id', $user->id)
                        ->whereNull('read_at')
                        ->whereNull('deleted_at');
                });
                break;
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%")
                    ->orWhereHas('sender', function ($senderQuery) use ($search) {
                        $senderQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $messages = $query->paginate(20)->withQueryString();

        // Get folder counts
        $counts = [
            'inbox' => MessageRecipient::where('recipient_id', $user->id)
                ->whereNull('deleted_at')
                ->count(),
            'sent' => Message::where('sender_id', $user->id)
                ->whereNotNull('sent_at')
                ->count(),
            'drafts' => Message::where('sender_id', $user->id)
                ->whereNull('sent_at')
                ->count(),
            'unread' => MessageRecipient::where('recipient_id', $user->id)
                ->whereNull('read_at')
                ->whereNull('deleted_at')
                ->count(),
        ];

        return Inertia::render('messages/index', [
            'messages' => $messages,
            'currentFolder' => $folder,
            'counts' => $counts,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $currentUser = Auth::user();

        // Get tenant staff (users)
        $users = User::where('tenant_id', $currentUser->tenant_id)
            ->where('id', '!=', $currentUser->id)
            ->select('id', 'name', 'email')
            ->selectRaw("'user' as type")
            ->get();

        // Get tenant customers
        $customers = Customer::where('tenant_id', $currentUser->tenant_id)
            ->select('id', 'email')
            ->selectRaw("CONCAT(first_name, ' ', last_name, ' (Customer)') as name")
            ->selectRaw("'customer' as type")
            ->get();

        // Combine users and customers
        $recipients = $users->concat($customers);

        return Inertia::render('messages/create', [
            'users' => $recipients,
        ]);
    }

    public function store(MessageRequest $request)
    {

        // dd($request->all());
        $validated = $request->validated();

        $currentUser = Auth::user();

        // Validate recipients against both users and customers of the same tenant
        $validUserIds = User::where('tenant_id', $currentUser->tenant_id)->pluck('id')->toArray();
        $validCustomerIds = Customer::where('tenant_id', $currentUser->tenant_id)->pluck('id')->toArray();
        $validRecipientIds = array_merge($validUserIds, $validCustomerIds);

        foreach ($validated['recipients'] as $recipientId) {
            if (! in_array($recipientId, $validRecipientIds)) {
                return back()->withErrors(['recipients' => 'One or more selected recipients are invalid.']);
            }
        }

        // Handle file uploads
        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('message-attachments', 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            }
        }

        // ✅ Decide whether message should be sent or saved as draft
        $shouldSend = $request->input('action') === 'send';

        // Create the message
        $message = Message::create([
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'priority' => $validated['priority'],
            'sender_id' => $currentUser->id,
            'recipients' => $validated['recipients'],
            'attachments' => $attachments,
            'sent_at' => $shouldSend ? now() : null,
        ]);

        // Add recipients
        $recipients = collect($validated['recipients'])->map(fn ($recipientId) => [
            'message_id' => $message->id,
            'recipient_id' => $recipientId,
            'recipient_type' => 'to',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        MessageRecipient::insert($recipients->toArray());

        // Dispatch events for each recipient if message is sent
        if ($shouldSend) {
            foreach ($validated['recipients'] as $recipientId) {
                $recipient = User::find($recipientId) ?? Customer::find($recipientId);
                if ($recipient) {
                    event(new MessageSent($message, $recipient));
                }
            }
        }

        $action = $shouldSend ? 'sent' : 'saved as draft';

        return redirect()->route('messages.index')
            ->with('success', "Message {$action} successfully.");
    }

    public function show(Message $message)
    {
        // Check if user has access to this message
        $user = Auth::user();
        $hasAccess = $message->sender_id === $user->id ||
                    $message->messageRecipients()->where('recipient_id', $user->id)->exists();

        if (! $hasAccess) {
            abort(403, 'Unauthorized access to message.');
        }

        $message->load(['sender', 'messageRecipients.recipient']);

        // Mark as read if user is a recipient
        if ($message->sender_id !== $user->id) {
            $message->markAsRead($user);
        }

        return Inertia::render('messages/show', [
            'message' => $message,
        ]);
    }

    public function edit(Message $message)
    {
        // Only sender can edit drafts
        if ($message->sender_id !== Auth::id() || $message->isSent()) {
            abort(403, 'Cannot edit this message.');
        }

        $message->load('messageRecipients.recipient');

        $currentUser = Auth::user();

        // Get tenant staff (users)
        $users = User::where('tenant_id', $currentUser->tenant_id)
            ->where('id', '!=', $currentUser->id)
            ->select('id', 'name', 'email')
            ->selectRaw("'user' as type")
            ->get();

        // Get tenant customers
        $customers = Customer::where('tenant_id', $currentUser->tenant_id)
            ->select('id', 'email')
            ->selectRaw("CONCAT(first_name, ' ', last_name, ' (Customer)') as name")
            ->selectRaw("'customer' as type")
            ->get();

        // Combine users and customers
        $recipients = $users->concat($customers);

        return Inertia::render('messages/edit', [
            'message' => $message,
            'users' => $recipients,
        ]);
    }

    public function update(MessageRequest $request, Message $message)
    {
        // Only sender can update drafts
        if ($message->sender_id !== Auth::id() || $message->isSent()) {
            abort(403, 'Cannot update this message.');
        }

        $validated = $request->validated();

        // Handle file uploads
        $attachments = $message->attachments ?? [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('message-attachments', 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            }
        }

        // Check if message should be sent using multiple methods
        $shouldSend = $request->has('send') ||
                     $request->input('send') ||
                     ($validated['send'] ?? false) ||
                     ($validated['action'] ?? null) === 'send' ||
                     $request->input('action') === 'send';

        $message->update([
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'priority' => $validated['priority'],
            'recipients' => $validated['recipients'] ?? [],
            'attachments' => $attachments,
            'sent_at' => $shouldSend ? now() : null,
        ]);

        // Update recipients
        $message->messageRecipients()->delete();

        $recipients = collect($validated['recipients'])
            ->map(fn ($recipientId) => [
                'message_id' => $message->id,
                'recipient_id' => $recipientId,
                'recipient_type' => 'to',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        MessageRecipient::insert($recipients->toArray());

        // Dispatch events for each recipient if message is sent
        if ($shouldSend) {
            foreach ($validated['recipients'] as $recipientId) {
                $recipient = User::find($recipientId) ?? Customer::find($recipientId);
                if ($recipient) {
                    event(new MessageSent($message, $recipient));
                }
            }
        }

        $action = $shouldSend ? 'sent' : 'updated';

        return redirect()->route('messages.show', $message)
            ->with('success', "Message {$action} successfully.");
    }

    public function destroy(Message $message)
    {
        $user = Auth::user();

        if ($message->sender_id === $user->id) {
            // Sender can delete the message entirely
            $message->delete();
            $message = 'Message deleted successfully.';
        } else {
            // Recipients can only mark as deleted
            $message->messageRecipients()
                ->where('recipient_id', $user->id)
                ->update(['deleted_at' => now()]);
            $message = 'Message moved to trash.';
        }

        return back()->with('success', $message);
    }

    public function markAsRead(Request $request)
    {
        $messageIds = $request->validate([
            'message_ids' => 'required|array',
            'message_ids.*' => 'exists:messages,id',
        ])['message_ids'];

        MessageRecipient::whereIn('message_id', $messageIds)
            ->where('recipient_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back()->with('success', 'Messages marked as read.');
    }

    public function markAsUnread(Request $request)
    {
        $messageIds = $request->validate([
            'message_ids' => 'required|array',
            'message_ids.*' => 'exists:messages,id',
        ])['message_ids'];

        MessageRecipient::whereIn('message_id', $messageIds)
            ->where('recipient_id', Auth::id())
            ->update(['read_at' => null]);

        return back()->with('success', 'Messages marked as unread.');
    }

    public function bulkDelete(Request $request)
    {
        $messageIds = $request->validate([
            'message_ids' => 'required|array',
            'message_ids.*' => 'exists:messages,id',
        ])['message_ids'];

        $user = Auth::user();

        // For messages where user is sender, delete entirely
        Message::whereIn('id', $messageIds)
            ->where('sender_id', $user->id)
            ->delete();

        // For messages where user is recipient, mark as deleted
        MessageRecipient::whereIn('message_id', $messageIds)
            ->where('recipient_id', $user->id)
            ->update(['deleted_at' => now()]);

        return back()->with('success', 'Messages deleted successfully.');
    }

    public function downloadAttachment(Message $message, $attachmentIndex)
    {
        $user = Auth::user();
        $hasAccess = $message->sender_id === $user->id ||
                    $message->messageRecipients()->where('recipient_id', $user->id)->exists();

        if (! $hasAccess) {
            abort(403, 'Unauthorized access to attachment.');
        }

        $attachments = $message->attachments ?? [];

        if (! isset($attachments[$attachmentIndex])) {
            abort(404, 'Attachment not found.');
        }

        $attachment = $attachments[$attachmentIndex];

        return response()->download(
            Storage::disk('public')->path($attachment['path']),
            $attachment['name']
        );
    }

    public function send(Message $message)
    {
        // Only sender can send drafts
        if ($message->sender_id !== Auth::id() || $message->isSent()) {
            abort(403, 'Cannot send this message.');
        }

        $message->update(['sent_at' => now()]);

        return redirect()->route('messages.show', $message)
            ->with('success', 'Message sent successfully.');
    }
}
