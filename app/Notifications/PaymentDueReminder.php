<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentDueReminder extends Notification implements ShouldQueue
{
    use \App\Traits\TenantAwareMail, Queueable;

    public function __construct(
        public Payment $payment,
        public int $daysUntilDue
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
        $message = (new MailMessage)
            ->subject('Payment Due Reminder')
            ->greeting('Hello!')
            ->line('A payment is due soon.')
            ->line('Policy: '.$this->payment->policy->policy_number)
            ->line('Amount Due: $'.number_format($this->payment->amount, 2))
            ->line('Due Date: '.$this->payment->due_date->format('M d, Y'));

        if ($this->daysUntilDue <= 3) {
            $message->line('⚠️ Payment is due in '.$this->daysUntilDue.' days!');
        } else {
            $message->line('Payment is due in '.$this->daysUntilDue.' days.');
        }

        $message->action('Make Payment', route('payments.create', $this->payment->policy))
            ->line('Please make your payment before the due date to avoid any late fees.');

        return collect([$message])->pipe(function ($collection) {
            $mail = $collection->first();

            return $this->configureTenantMail($mail, $this->payment->policy->tenant);
        });
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'payment_id' => $this->payment->id,
            'policy_number' => $this->payment->policy->policy_number,
            'amount' => $this->payment->amount,
            'due_date' => $this->payment->due_date->toISOString(),
            'days_until_due' => $this->daysUntilDue,
            'customer_name' => $this->payment->policy->customer->first_name.' '.$this->payment->policy->customer->last_name,
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
            'type' => 'payment_due_reminder',
            'title' => 'Payment Due Reminder',
            'message' => 'Payment of $'.number_format($this->payment->amount, 2).' is due in '.$this->daysUntilDue.' days',
            'data' => $this->toArray($notifiable),
            'created_at' => now()->toISOString(),
        ];
    }
}
