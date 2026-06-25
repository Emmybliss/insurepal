<?php

namespace App\Notifications;

use App\Models\Tenant;
use App\Models\TenantRelationship;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantRelationshipAccepted extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public TenantRelationship $relationship,
        public Tenant $acceptedByTenant
    ) {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('tenant-relationships.index', ['tab' => 'accepted']);

        return (new MailMessage)
            ->subject('Business Relationship Request Accepted')
            ->greeting('Great News!')
            ->line("{$this->acceptedByTenant->name} has accepted your business relationship request.")
            ->line('You can now collaborate and view each other\'s business details.')
            ->action('View Relationships', $url)
            ->line('Thank you for using our platform!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'relationship_id' => $this->relationship->id,
            'accepted_by_tenant_id' => $this->acceptedByTenant->id,
            'accepted_by_tenant_name' => $this->acceptedByTenant->name,
            'type' => 'relationship_accepted',
        ];
    }
}
