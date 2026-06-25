<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\User;
use App\Services\SupportTicketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
    public function __construct(
        private SupportTicketService $ticketService
    ) {}

    public function index(Request $request)
    {
        $user = Auth::user();

        $filters = $request->only(['status', 'priority', 'category', 'assignee_id', 'search', 'per_page']);
        $ticketsPaginator = $this->ticketService->getUserTickets($user, $filters);
        $stats = $this->ticketService->getTicketStats($user);

        // Get available assignees for filter dropdown
        $assignees = User::where('tenant_id', $user->tenant_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['underwriter', 'broker', 'underwriter_staff', 'broker_staff']);
            })
            ->select('id', 'name', 'email')
            ->get();

        // Format stats to match component expectations
        $formattedStats = [
            'total' => $stats['total'],
            'open' => $stats['by_status']['open'] ?? 0,
            'in_progress' => $stats['by_status']['in_progress'] ?? 0,
            'resolved' => $stats['by_status']['resolved'] ?? 0,
            'closed' => $stats['by_status']['closed'] ?? 0,
        ];

        return Inertia::render('support-tickets/index', [
            'tickets' => $ticketsPaginator->items(), // Pass array of tickets, not paginator
            'stats' => $formattedStats,
            'assignees' => $assignees,
            'filters' => $filters,
            'canCreateTicket' => true, // Available to all authenticated users
            'canManageTickets' => $user->can('view_all_tickets'),
            'pagination' => [
                'current_page' => $ticketsPaginator->currentPage(),
                'last_page' => $ticketsPaginator->lastPage(),
                'per_page' => $ticketsPaginator->perPage(),
                'total' => $ticketsPaginator->total(),
            ],
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        // Get available assignees for assignment dropdown
        $users = User::where('tenant_id', $user->tenant_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['underwriter', 'broker', 'underwriter_staff', 'broker_staff']);
            })
            ->select('id', 'name', 'email')
            ->get();

        // Define categories and priorities
        $categories = [
            ['value' => 'technical', 'label' => 'Technical Issue', 'description' => 'Software bugs, system errors, or technical problems'],
            ['value' => 'billing', 'label' => 'Billing & Payments', 'description' => 'Payment issues, billing questions, refunds'],
            ['value' => 'general', 'label' => 'General Inquiry', 'description' => 'General questions or information requests'],
            ['value' => 'feature_request', 'label' => 'Feature Request', 'description' => 'Suggestions for new features or improvements'],
            ['value' => 'bug_report', 'label' => 'Bug Report', 'description' => 'Report a bug or issue with the system'],
        ];

        $priorities = [
            ['value' => 'low', 'label' => 'Low', 'description' => 'Non-urgent requests'],
            ['value' => 'medium', 'label' => 'Medium', 'description' => 'Standard priority'],
            ['value' => 'high', 'label' => 'High', 'description' => 'Important issues that need attention'],
            ['value' => 'urgent', 'label' => 'Urgent', 'description' => 'Critical issues requiring immediate attention'],
        ];

        return Inertia::render('support-tickets/create', [
            'users' => $users,
            'categories' => $categories,
            'priorities' => $priorities,
            'canAssignToOthers' => $user->can('assign_tickets'),
        ]);
    }

    public function store(\App\Http\Requests\SupportTicketRequest $request)
    {
        $user = Auth::user();

        $ticket = $this->ticketService->createTicket($request->validated(), $user);

        return redirect()->route('support-tickets.show', $ticket)
            ->with('success', 'Support ticket created successfully.');
    }

    public function show(SupportTicket $ticket)
    {

        $user = Auth::user();

        // Check authorization
        if ($user->hasRole('customer')) {
            if ($ticket->requester_id != $user->id) {
                abort(403, 'You are not authorized to view this ticket.');
            }
        } elseif (! $user->can('view_all_tickets')) {
            if ($ticket->requester_id != $user->id && $ticket->assignee_id != $user->id) {
                abort(403, 'You are not authorized to view this ticket.');
            }
        }

        $ticket->load(['requester', 'assignee']);

        // Get available assignees for assignment dropdown
        $assignees = User::where('tenant_id', $user->tenant_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['underwriter', 'broker', 'underwriter_staff', 'broker_staff']);
            })
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('support-tickets/show', [
            'ticket' => $ticket,
            'messages' => [],
            'assignees' => $assignees,
            'currentUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar ?? null,
            ],
            'canManageTicket' => $user->can('edit_support_tickets') || $ticket->requester_id === $user->id,
            'canAssignTicket' => $user->can('assign_tickets'),
            'canResolveTicket' => $user->can('resolve_tickets'),
            'canCloseTicket' => $user->can('close_tickets'),
            'canReopenTicket' => $user->can('edit_support_tickets'),
        ]);
    }

    public function assign(Request $request, SupportTicket $ticket)
    {
        $user = Auth::user();

        if (! $user->can('assign_tickets')) {
            abort(403, 'You are not authorized to assign tickets.');
        }

        $request->validate([
            'assignee_id' => 'required|exists:users,id',
        ]);

        $assignee = User::findOrFail($request->assignee_id);
        $this->ticketService->assignTicket($ticket, $assignee, $user);

        return response()->json(['success' => true]);
    }

    public function changeStatus(Request $request, SupportTicket $ticket)
    {
        $user = Auth::user();

        if (! $user->can('edit_support_tickets')) {
            abort(403, 'You are not authorized to change ticket status.');
        }

        $request->validate([
            'status' => 'required|in:new,open,in_progress,waiting_customer,resolved,closed',
        ]);

        $this->ticketService->changeStatus($ticket, $request->status, $user);

        return response()->json(['success' => true]);
    }

    public function resolve(SupportTicket $ticket)
    {
        $user = Auth::user();

        if (! $user->can('resolve_tickets')) {
            abort(403, 'You are not authorized to resolve tickets.');
        }

        $this->ticketService->changeStatus($ticket, 'resolved', $user);

        return response()->json(['success' => true]);
    }

    public function close(SupportTicket $ticket)
    {
        $user = Auth::user();

        if (! $user->can('close_tickets')) {
            abort(403, 'You are not authorized to close tickets.');
        }

        $this->ticketService->changeStatus($ticket, 'closed', $user);

        return response()->json(['success' => true]);
    }

    public function reopen(SupportTicket $ticket)
    {
        $user = Auth::user();

        if (! $user->can('edit_support_tickets')) {
            abort(403, 'You are not authorized to reopen tickets.');
        }

        $this->ticketService->changeStatus($ticket, 'open', $user);

        return response()->json(['success' => true]);
    }

    public function escalate(Request $request, SupportTicket $ticket)
    {
        $user = Auth::user();

        if (! $user->can('escalate_tickets')) {
            abort(403, 'You are not authorized to escalate tickets.');
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $this->ticketService->escalateTicket($ticket, $request->reason, $user);

        return response()->json(['success' => true]);
    }
}
