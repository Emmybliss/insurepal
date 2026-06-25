<?php

namespace App\Console\Commands;

use App\Mail\ScheduledReportMail;
use App\Models\ScheduledReport;
use App\Services\Exports\ExcelExportService;
use App\Services\Exports\PDFExportService;
use App\Services\ReportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class ProcessScheduledReports extends Command
{
    protected $signature = 'reports:process-scheduled';

    protected $description = 'Process all scheduled reports that are due for execution';

    public function handle()
    {
        $scheduledReports = ScheduledReport::dueForExecution()->get();

        if ($scheduledReports->isEmpty()) {
            $this->info('No scheduled reports due for execution.');

            return;
        }

        $this->info("Processing {$scheduledReports->count()} scheduled reports...");

        foreach ($scheduledReports as $scheduledReport) {
            $this->processScheduledReport($scheduledReport);
        }

        $this->info('Scheduled reports processing completed.');
    }

    protected function processScheduledReport(ScheduledReport $scheduledReport): void
    {
        try {
            $this->info("Processing scheduled report: {$scheduledReport->report_type} for tenant {$scheduledReport->tenant_id}");

            // Generate report data
            $reportService = app(ReportService::class);
            $data = $reportService->getReportData(
                $scheduledReport->report_type,
                $scheduledReport->filters['period'] ?? 'last_30_days'
            );

            $files = [];

            // Generate files based on format
            if ($scheduledReport->format === 'pdf' || $scheduledReport->format === 'both') {
                $pdfService = app(PDFExportService::class);
                $pdfPath = $pdfService->exportReport(
                    $scheduledReport->report_type,
                    $data,
                    $scheduledReport->filters['period'] ?? 'last_30_days'
                );
                $files[] = $pdfPath;
            }

            if ($scheduledReport->format === 'excel' || $scheduledReport->format === 'both') {
                $excelService = app(ExcelExportService::class);
                $excelPath = $excelService->exportReport(
                    $scheduledReport->report_type,
                    $data,
                    $scheduledReport->filters['period'] ?? 'last_30_days'
                );
                $files[] = $excelPath;
            }

            // Send email with attachments
            $this->sendReportEmail($scheduledReport, $files);

            // Mark as successfully executed
            $scheduledReport->markAsExecuted(true);

            // Clean up files
            foreach ($files as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }

            $this->info("Successfully processed scheduled report: {$scheduledReport->report_type}");

        } catch (\Exception $e) {
            $this->error("Failed to process scheduled report {$scheduledReport->report_type}: {$e->getMessage()}");

            $scheduledReport->markAsExecuted(false, $e->getMessage());

            // Disable if too many consecutive failures
            if ($scheduledReport->shouldBeDisabled()) {
                $scheduledReport->update(['is_active' => false]);
                $this->warn("Disabled scheduled report {$scheduledReport->id} due to consecutive failures.");
            }
        }
    }

    protected function sendReportEmail(ScheduledReport $scheduledReport, array $files): void
    {
        $reportTitle = $this->getReportTitle($scheduledReport->report_type);
        $generatedAt = now()->format('Y-m-d H:i:s');
        $tenantName = $scheduledReport->tenant->name;

        foreach ($scheduledReport->recipients as $email) {
            Mail::to($email)->queue(
                new ScheduledReportMail($scheduledReport, $reportTitle, $generatedAt, $tenantName, $files)
            );
        }
    }

    protected function getReportTitle(string $reportType): string
    {
        return match ($reportType) {
            'naicom' => 'NAICOM Compliance Report',
            'business-overview' => 'Business Overview Report',
            'customer-analytics' => 'Customer Analytics Report',
            'product-performance' => 'Product Performance Report',
            'claims-analytics' => 'Claims Analytics Report',
            'financial-analytics' => 'Financial Analytics Report',
            'compliance-dashboard' => 'Compliance Dashboard Report',
            default => 'Report'
        };
    }
}
