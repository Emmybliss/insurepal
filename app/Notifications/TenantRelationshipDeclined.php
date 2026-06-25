<?php

namespace App\Notifications;

use App\Models\Tenant;
use App\Models\TenantRelationship;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantRelationshipDeclined extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public TenantRelationship $relationship,
        public Tenant $declinedByTenant
    ) {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('tenant-relationships.discover');

        return (new MailMessage)
            ->subject('Business Relationship Request Declined')
            ->greeting('Hello,')
            ->line("{$this->declinedByTenant->name} has declined your business relationship request.")
            ->when($this->relationship->decline_reason, function ($mail) {
                return $mail->line('**Reason:** '.$this->relationship->decline_reason);
            })
            ->action('Discover Other Partners', $url)
            ->line('Thank you for using our platform!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'relationship_id' => $this->relationship->id,
            'declined_by_tenant_id' => $this->declinedByTenant->id,
            'declined_by_tenant_name' => $this->declinedByTenant->name,
            'decline_reason' => $this->relationship->decline_reason,
            'type' => 'relationship_declined',
        ];
    }
}
