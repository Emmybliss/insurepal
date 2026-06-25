<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInboxMessageRequest;
use App\Http\Requests\UpdateDraftRequest;
use App\Models\CommunicationParticipant;
use App\Models\CommunicationThread;
use App\Services\CommunicationAttachmentService;
use App\Services\CommunicationMessageService;
use App\Services\CommunicationThreadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InboxController extends Controller
{
    public function __construct(
        private CommunicationThreadService $threadService,
        private CommunicationMessageService $messageService,
        private CommunicationAttachmentService $attachmentService
    ) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        $folder = $request->get('folder', 'inbox');
        $filters = $request->only(['search']);

        $threads = $this->threadService->getInboxFolder($user, $folder, $filters);
        $stats = $this->threadService->getThreadStats($user);

        return Inertia::render('inbox/Index', [
            'threads' => $threads,
            'folder' => $folder,
            'stats' => $stats,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $recipients = \App\Models\User::where('tenant_id', $user->tenant_id)
            ->where('id', '!=', $user->id)
            ->select('id', 'name', 'email', 'avatar')
            ->orderBy('name')
            ->get();

        $customers = \App\Models\Customer::where('tenant_id', $user->tenant_id)
            ->select('id')
            ->selectRaw("CONCAT(first_name, ' ', last_name) as name")
            ->orderBy('first_name')
            ->get()
            ->map(fn ($c) => (object) ['id' => $c->id, 'name' => $c->name, 'type' => 'customer']);

        return Inertia::render('inbox/Create', [
            'recipients' => $recipients,
            'customers' => $customers,
        ]);
    }

    public function store(StoreInboxMessageRequest $request)
    {
        $user = Auth::user();
        $validated = $request->validated();

        $shouldSend = $request->shouldSend();

        if ($shouldSend) {
            $thread = $this->threadService->createEmailThread($user, [
                'subject' => $validated['subject'],
                'type' => 'general',
                'priority' => $validated['priority'],
                'recipients' => $validated['recipients'],
                'cc' => $validated['cc'] ?? [],
                'bcc' => $validated['bcc'] ?? [],
                'related_type' => $validated['related_type'] ?? null,
                'related_id' => $validated['related_id'] ?? null,
                'initial_message' => $validated['body'],
            ]);

            $message = $thread->latestMessage;

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $this->attachmentService->upload($file, $message);
                }
            }

            return redirect()->route('inbox.show', $thread)
                ->with('success', 'Message sent successfully.');
        }

        $draftThread = $this->threadService->createEmailThread($user, [
            'subject' => $validated['subject'],
            'type' => 'general',
            'priority' => $validated['priority'],
            'recipients' => $validated['recipients'],
            'cc' => $validated['cc'] ?? [],
            'bcc' => $validated['bcc'] ?? [],
            'related_type' => $validated['related_type'] ?? null,
            'related_id' => $validated['related_id'] ?? null,
        ]);

        $draftMessage = $this->messageService->saveDraft($draftThread, $user, [
            'body' => $validated['body'],
            'body_type' => 'plain',
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $this->attachmentService->upload($file, $draftMessage);
            }
        }

        return redirect()->route('inbox.edit', $draftThread)
            ->with('success', 'Draft saved successfully.');
    }

    public function show(CommunicationThread $thread)
    {
        $user = Auth::user();

        if (! $thread->hasValidParticipantRole($user->id)) {
            abort(403, 'You are not authorized to view this thread.');
        }

        if ($thread->mode !== 'email') {
            abort(404, 'Thread not found.');
        }

        $thread->load(['creator', 'participants.user', 'assignee', 'messages.sender', 'messages.attachments']);

        $this->threadService->markAsRead($thread, $user);

        return Inertia::render('inbox/Show', [
            'thread' => $thread,
        ]);
    }

    public function editDraft(CommunicationThread $thread)
    {
        $user = Auth::user();

        if (! $thread->hasValidParticipantRole($user->id)) {
            abort(403, 'You are not authorized to edit this draft.');
        }

        if ($thread->mode !== 'email') {
            abort(404, 'Thread not found.');
        }

        $thread->load(['creator', 'participants.user', 'messages' => fn ($q) => $q->where('is_draft', true), 'messages.attachments']);

        $recipients = \App\Models\User::where('tenant_id', $user->tenant_id)
            ->where('id', '!=', $user->id)
            ->select('id', 'name', 'email', 'avatar')
            ->orderBy('name')
            ->get();

        return Inertia::render('inbox/Edit', [
            'thread' => $thread,
            'recipients' => $recipients,
        ]);
    }

    public function updateDraft(UpdateDraftRequest $request, CommunicationThread $thread)
    {
        $user = Auth::user();
        $validated = $request->validated();

        if (! $thread->hasValidParticipantRole($user->id)) {
            abort(403, 'You are not authorized to edit this draft.');
        }

        $thread->update([
            'subject' => $validated['subject'],
            'priority' => $validated['priority'],
        ]);

        $thread->participants()->whereIn('role', ['recipient', 'cc', 'bcc'])->delete();

        foreach ($validated['recipients'] as $recipientId) {
            $this->threadService->addParticipant($thread, \App\Models\User::find($recipientId), 'recipient');
        }

        if (isset($validated['cc'])) {
            foreach ($validated['cc'] as $ccId) {
                $this->threadService->addParticipant($thread, \App\Models\User::find($ccId), 'cc');
            }
        }

        if (isset($validated['bcc'])) {
            foreach ($validated['bcc'] as $bccId) {
                $this->threadService->addParticipant($thread, \App\Models\User::find($bccId), 'bcc');
            }
        }

        $draftMessage = $thread->messages()->where('is_draft', true)->first();

        if ($draftMessage) {
            $this->messageService->editDraft($draftMessage, [
                'body' => $validated['body'],
            ]);

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $this->attachmentService->upload($file, $draftMessage);
                }
            }
        }

        if ($request->shouldSend()) {
            return $this->sendDraft($thread);
        }

        return back()->with('success', 'Draft updated successfully.');
    }

    public function sendDraft(CommunicationThread $thread)
    {
        $user = Auth::user();

        if (! $thread->hasValidParticipantRole($user->id)) {
            abort(403, 'You are not authorized to send this draft.');
        }

        $draftMessage = $thread->messages()->where('is_draft', true)->first();

        if ($draftMessage) {
            $this->messageService->sendDraft($draftMessage);
        }

        return redirect()->route('inbox.show', $thread)
            ->with('success', 'Message sent successfully.');
    }

    public function bulkAction(Request $request)
    {
        $request->validate([
            'thread_ids' => 'required|array',
            'thread_ids.*' => 'exists:communication_threads,id',
            'action' => 'required|in:read,unread,delete,archive',
        ]);

        $user = Auth::user();
        $threadIds = $request->input('thread_ids');
        $action = $request->input('action');

        $threads = CommunicationThread::query()
            ->whereIn('id', $threadIds)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->get();

        foreach ($threads as $thread) {
            match ($action) {
                'read' => $this->threadService->markAsRead($thread, $user),
                'unread' => CommunicationParticipant::where('communication_thread_id', $thread->id)
                    ->where('user_id', $user->id)
                    ->update(['last_read_at' => null]),
                'delete' => CommunicationParticipant::where('communication_thread_id', $thread->id)
                    ->where('user_id', $user->id)
                    ->update(['deleted_at' => now()]),
                'archive' => $thread->update(['status' => 'archived']),
                default => null,
            };
        }

        return back()->with('success', 'Bulk action completed successfully.');
    }

    public function archive(CommunicationThread $thread)
    {
        $user = Auth::user();

        if (! $thread->hasValidParticipantRole($user->id)) {
            abort(403, 'You are not authorized to archive this thread.');
        }

        $thread->update(['status' => 'archived']);

        return back()->with('success', 'Thread archived successfully.');
    }

    public function destroy(CommunicationThread $thread)
    {
        $user = Auth::user();

        if (! $thread->hasValidParticipantRole($user->id)) {
            abort(403, 'You are not authorized to delete this thread.');
        }

        if ($thread->created_by === $user->id) {
            $thread->delete();

            return back()->with('success', 'Thread deleted successfully.');
        }

        CommunicationParticipant::where('communication_thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->update(['deleted_at' => now()]);

        return back()->with('success', 'Thread moved to trash.');
    }
}
