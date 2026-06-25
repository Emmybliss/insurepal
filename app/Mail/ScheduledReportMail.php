<?php

namespace App\Mail;

use App\Models\ScheduledReport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ScheduledReportMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public ScheduledReport $scheduledReport,
        public string $reportTitle,
        public string $generatedAt,
        public string $tenantName,
        public array $files = []
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Scheduled Report: {$this->reportTitle} - ".now()->format('Y-m-d'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.scheduled-report',
            with: [
                'reportType' => $this->scheduledReport->report_type,
                'reportTitle' => $this->reportTitle,
                'generatedAt' => $this->generatedAt,
                'tenantName' => $this->tenantName,
            ],
        );
    }

    public function attachments(): array
    {
        $attachments = [];
        foreach ($this->files as $file) {
            $attachments[] = \Illuminate\Mail\Mailables\Attachment::fromPath($file);
        }

        return $attachments;
    }
}
