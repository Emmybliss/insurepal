<?php

namespace App\Services;

use App\Events\TicketStatusChanged;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class SupportTicketService
{
    public function createTicket(array $data, User $requester): SupportTicket
    {
        // Create the ticket
        $ticket = SupportTicket::create([
            'tenant_id' => $requester->tenant_id,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'status' => 'new',
            'priority' => $data['priority'] ?? 'medium',
            'category' => $data['category'] ?? 'general',
            'requester_id' => $requester->id,
            'assignee_id' => $data['assignee_id'] ?? null,
        ]);

        // Auto-assign if no assignee specified
        if (! $ticket->assignee_id) {
            $this->autoAssignTicket($ticket);
        }

        return $ticket->load(['requester', 'assignee']);
    }

    public function assignTicket(SupportTicket $ticket, User $assignee, ?User $assignedBy = null): void
    {
        $oldAssignee = $ticket->assignee;

        $ticket->assign($assignee->id);

        // Broadcast status change
        broadcast(new TicketStatusChanged($ticket, 'unassigned', 'assigned', $assignedBy));
    }

    public function autoAssignTicket(SupportTicket $ticket): ?User
    {
        // Find available staff based on workload and availability
        $availableStaff = $this->getAvailableStaff($ticket->tenant_id);

        if ($availableStaff->isEmpty()) {
            return null;
        }

        // Simple round-robin assignment (can be enhanced with more sophisticated logic)
        $assignee = $availableStaff->first();
        $this->assignTicket($ticket, $assignee);

        return $assignee;
    }

    private function getAvailableStaff(int $tenantId): Collection
    {
        return User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['underwriter', 'broker', 'underwriter_staff', 'broker_staff']);
            })
            ->whereHas('permissions', function ($query) {
                $query->where('name', 'accept_chat_requests');
            })
            ->withCount(['supportTickets' => function ($query) {
                $query->whereIn('status', ['new', 'open', 'in_progress']);
            }])
            ->orderBy('support_tickets_count')
            ->get();
    }

    public function changeStatus(SupportTicket $ticket, string $newStatus, ?User $changedBy = null): void
    {
        $oldStatus = $ticket->status;

        $ticket->update(['status' => $newStatus]);

        // Handle specific status changes
        switch ($newStatus) {
            case 'resolved':
                $ticket->resolve();
                break;
            case 'closed':
                $ticket->close();
                break;
            case 'open':
                if ($oldStatus === 'closed') {
                    $ticket->reopen();
                }
                break;
        }

        // Broadcast status change
        broadcast(new TicketStatusChanged($ticket, $oldStatus, $newStatus, $changedBy));
    }

    public function escalateTicket(SupportTicket $ticket, string $reason, ?User $escalatedBy = null): void
    {
        $oldPriority = $ticket->priority;
        $newPriority = $this->getNextPriorityLevel($oldPriority);

        $ticket->update(['priority' => $newPriority]);
    }

    private function getNextPriorityLevel(string $currentPriority): string
    {
        return match ($currentPriority) {
            'low' => 'medium',
            'medium' => 'high',
            'high' => 'urgent',
            'urgent' => 'urgent', // Already at highest
            default => 'medium',
        };
    }

    public function getUserTickets(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = SupportTicket::query()
            ->where('tenant_id', $user->tenant_id)
            ->with(['requester', 'assignee']);

        // Apply user-specific filters
        if ($user->hasRole('customer')) {
            $query->where('requester_id', $user->id);
        } elseif (! $user->hasPermissionTo('view_all_tickets')) {
            $query->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                    ->orWhere('assignee_id', $user->id);
            });
        }

        // Apply additional filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['assignee_id'])) {
            $query->where('assignee_id', $filters['assignee_id']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('ticket_number', 'like', '%'.$filters['search'].'%')
                    ->orWhere('subject', 'like', '%'.$filters['search'].'%')
                    ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function getTicketStats(User $user): array
    {
        $baseQuery = SupportTicket::query()->where('tenant_id', $user->tenant_id);

        // Apply user-specific filters
        if ($user->hasRole('customer')) {
            $baseQuery->where('requester_id', $user->id);
        } elseif (! $user->hasPermissionTo('view_all_tickets')) {
            $baseQuery->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id)
                    ->orWhere('assignee_id', $user->id);
            });
        }

        return [
            'total' => $baseQuery->count(),
            'by_status' => $baseQuery->clone()->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'by_priority' => $baseQuery->clone()->selectRaw('priority, count(*) as count')
                ->groupBy('priority')
                ->pluck('count', 'priority')
                ->toArray(),
            'by_category' => $baseQuery->clone()->selectRaw('category, count(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray(),
            'assigned_to_me' => $baseQuery->clone()->where('assignee_id', $user->id)->count(),
            'created_by_me' => $baseQuery->clone()->where('requester_id', $user->id)->count(),
        ];
    }
}
