<?php

namespace App\Notifications;

use App\Models\Tenant;
use App\Models\TenantRelationship;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantRelationshipRemoved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public TenantRelationship $relationship,
        public Tenant $removedByTenant
    ) {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('tenant-relationships.index');

        return (new MailMessage)
            ->subject('Business Relationship Ended')
            ->greeting('Hello,')
            ->line("{$this->removedByTenant->name} has ended the business relationship with your organization.")
            ->line('You will no longer have access to their business details.')
            ->action('View Relationships', $url)
            ->line('Thank you for using our platform!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'relationship_id' => $this->relationship->id,
            'removed_by_tenant_id' => $this->removedByTenant->id,
            'removed_by_tenant_name' => $this->removedByTenant->name,
            'type' => 'relationship_removed',
        ];
    }
}
