<?php

namespace App\Notifications;

use App\Models\Tenant;
use App\Models\TenantRelationship;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantRelationshipRequested extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public TenantRelationship $relationship,
        public Tenant $requesterTenant
    ) {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = route('tenant-relationships.index', ['tab' => 'received']);

        return (new MailMessage)
            ->subject('New Business Relationship Request')
            ->greeting('Hello!')
            ->line("{$this->requesterTenant->name} has sent you a business relationship request.")
            ->when($this->relationship->request_message, function ($mail) {
                return $mail->line('**Message:** '.$this->relationship->request_message);
            })
            ->action('View Request', $url)
            ->line('You can accept or decline this request from your Relationships page.')
            ->line('Thank you for using our platform!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'relationship_id' => $this->relationship->id,
            'requester_tenant_id' => $this->requesterTenant->id,
            'requester_tenant_name' => $this->requesterTenant->name,
            'message' => $this->relationship->request_message,
            'type' => 'relationship_requested',
        ];
    }
}
