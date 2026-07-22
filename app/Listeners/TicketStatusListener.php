<?php

namespace App\Listeners;

use App\Events\TicketStatusChanged;
use App\Services\PushNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class TicketStatusListener implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected PushNotificationService $pushNotification
    ) {}

    public function handle(TicketStatusChanged $event): void
    {
        $ticket = $event->ticket;

        if ($ticket->assignee_id) {
            try {
                $this->pushNotification->sendToUser($ticket->assignee, [
                    'title' => 'Ticket #'.$ticket->ticket_number.' status changed',
                    'body' => "Status changed from {$event->oldStatus} to {$event->newStatus}",
                    'url' => '/support/tickets/'.$ticket->id,
                    'tag' => 'ticket-'.$ticket->id,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to notify ticket assignee', [
                    'ticket_id' => $ticket->id,
                    'assignee_id' => $ticket->assignee_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Ticket status changed', [
            'ticket_id' => $ticket->id,
            'ticket_number' => $ticket->ticket_number,
            'old_status' => $event->oldStatus,
            'new_status' => $event->newStatus,
            'changed_by' => $event->changedBy?->id,
        ]);
    }
}
