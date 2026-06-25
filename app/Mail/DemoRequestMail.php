<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DemoRequestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     *
     * @param  string  $name  The requester's name
     * @param  string  $email  The requester's email
     * @param  string  $company  The requester's company
     * @param  bool  $isAdmin  Whether this is the admin notification copy
     */
    public function __construct(
        public string $name,
        public string $email,
        public string $company,
        public bool $isAdmin = false,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isAdmin
            ? "New Demo Request from {$this->name} ({$this->company})"
            : 'Your InsurePal Demo Request — We\'ll Be in Touch!';

        return new Envelope(subject: $subject);
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $view = $this->isAdmin ? 'emails.demo-request-admin' : 'emails.demo-request';

        return new Content(view: $view);
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
