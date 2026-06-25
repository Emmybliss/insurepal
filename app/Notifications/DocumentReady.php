<?php

namespace App\Notifications;

use App\Models\PolicyDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentReady extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PolicyDocument $document
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
        return ['mail', 'database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Document Ready')
            ->greeting('Hello!')
            ->line('Your document is ready for download.')
            ->line('Document Type: '.$this->document->document_type)
            ->line('Policy: '.$this->document->policy->policy_number)
            ->action('Download Document', route('documents.download', $this->document))
            ->line('You can download your document from your dashboard.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'document_id' => $this->document->id,
            'document_type' => $this->document->document_type,
            'policy_number' => $this->document->policy->policy_number,
            'file_name' => $this->document->file_name,
            'customer_name' => $this->document->policy->customer->first_name.' '.$this->document->policy->customer->last_name,
        ];
    }

    /**
     * Get the broadcast representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toBroadcast(object $notifiable): array
    {
        return [
            'id' => $this->id,
            'type' => 'document_ready',
            'title' => 'Document Ready',
            'message' => 'Your '.$this->document->document_type.' document is ready for download',
            'data' => $this->toArray($notifiable),
            'created_at' => now()->toISOString(),
        ];
    }
}
