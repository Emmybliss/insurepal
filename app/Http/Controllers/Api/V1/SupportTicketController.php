<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreSupportTicketRequest;
use App\Http\Requests\Api\V1\UpdateSupportTicketRequest;
use App\Http\Resources\Api\V1\SupportTicketCollection;
use App\Http\Resources\Api\V1\SupportTicketResource;
use App\Http\Responses\ApiResponse;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $query = SupportTicket::forTenant($tenantId)
            ->with(['requester', 'assignee']);

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('ticket_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status = $request->status) {
            $query->byStatus($status);
        }

        if ($priority = $request->priority) {
            $query->byPriority($priority);
        }

        if ($category = $request->category) {
            $query->byCategory($category);
        }

        if ($assigneeId = $request->assignee_id) {
            $query->assignedTo($assigneeId);
        }

        $query->when(
            $request->sort ?? '-created_at',
            fn ($q, $sort) => match (ltrim($sort, '-')) {
                'ticket_number', 'subject', 'status', 'priority', 'category', 'created_at' => $q->orderBy(
                    ltrim($sort, '-'),
                    str_starts_with($sort, '-') ? 'desc' : 'asc'
                ),
                default => $q->orderBy('created_at', 'desc'),
            }
        );

        $perPage = min((int) $request->input('per_page', 15), 100);
        $tickets = $query->paginate($perPage);

        return SupportTicketCollection::make($tickets)->response();
    }

    public function store(StoreSupportTicketRequest $request): JsonResponse
    {
        $user = $request->user();

        $ticket = SupportTicket::create([
            'tenant_id' => $user->tenant_id,
            'requester_id' => $user->id,
            'subject' => $request->validated('subject'),
            'description' => $request->validated('description'),
            'priority' => $request->validated('priority'),
            'category' => $request->validated('category'),
            'assignee_id' => $request->validated('assignee_id'),
            'status' => 'new',
        ]);

        $ticket->load(['requester', 'assignee']);

        return $this->respondCreated(
            new SupportTicketResource($ticket),
            'Support ticket created successfully.'
        );
    }

    public function show(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        if ($supportTicket->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        $supportTicket->load(['requester', 'assignee']);

        return $this->respond(new SupportTicketResource($supportTicket));
    }

    public function update(UpdateSupportTicketRequest $request, SupportTicket $supportTicket): JsonResponse
    {
        if ($supportTicket->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($supportTicket->isClosed()) {
            return $this->respondError('Closed tickets cannot be edited.', 422);
        }

        $supportTicket->update($request->validated());
        $supportTicket->load(['requester', 'assignee']);

        return $this->respond(
            new SupportTicketResource($supportTicket),
            'Support ticket updated successfully.'
        );
    }

    public function destroy(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        if ($supportTicket->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! $supportTicket->isClosed()) {
            return $this->respondError('Only closed tickets can be deleted.', 422);
        }

        $supportTicket->delete();

        return $this->respondNoContent('Support ticket deleted successfully.');
    }

    // ─── Workflow ───

    public function assign(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        if ($supportTicket->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($supportTicket->isClosed()) {
            return $this->respondError('Closed tickets cannot be assigned.', 422);
        }

        $request->validate([
            'assignee_id' => ['required', 'integer', 'exists:users,id'],
        ]); // single field — leave inline

        $supportTicket->assign($request->assignee_id);
        $supportTicket->load(['requester', 'assignee']);

        return $this->respond(
            new SupportTicketResource($supportTicket),
            'Support ticket assigned successfully.'
        );
    }

    public function resolve(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        if ($supportTicket->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($supportTicket->isClosed()) {
            return $this->respondError('Closed tickets cannot be resolved.', 422);
        }

        if ($supportTicket->isResolved()) {
            return $this->respondError('Ticket is already resolved.', 422);
        }

        $supportTicket->resolve();
        $supportTicket->load(['requester', 'assignee']);

        return $this->respond(
            new SupportTicketResource($supportTicket),
            'Support ticket resolved successfully.'
        );
    }

    public function close(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        if ($supportTicket->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if ($supportTicket->isClosed()) {
            return $this->respondError('Ticket is already closed.', 422);
        }

        $supportTicket->close();
        $supportTicket->load(['requester', 'assignee']);

        return $this->respond(
            new SupportTicketResource($supportTicket),
            'Support ticket closed successfully.'
        );
    }

    public function reopen(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        if ($supportTicket->tenant_id !== $request->user()->tenant_id) {
            return $this->respondForbidden();
        }

        if (! $supportTicket->isClosed()) {
            return $this->respondError('Only closed tickets can be reopened.', 422);
        }

        $supportTicket->reopen();
        $supportTicket->load(['requester', 'assignee']);

        return $this->respond(
            new SupportTicketResource($supportTicket),
            'Support ticket reopened successfully.'
        );
    }
}
