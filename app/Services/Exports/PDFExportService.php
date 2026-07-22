<?php

namespace App\Services\Exports;

use App\Services\Pdf\PdfService;

class PDFExportService
{
    public function __construct(
        protected PdfService $pdfService
    ) {}

    public function exportReport(string $reportType, array $data, string $period): string
    {
        $viewData = $this->prepareViewData($reportType, $data, $period);
        $view = $this->getViewName($reportType);

        $pdfContent = $this->pdfService->renderView($view, $viewData);

        $filename = 'report_'.$reportType.'_'.now()->format('Y_m_d_H_i_s').'.pdf';
        $filepath = storage_path('app/exports/'.$filename);

        // Ensure directory exists
        if (! file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        file_put_contents($filepath, $pdfContent);

        return $filepath;
    }

    protected function prepareViewData(string $reportType, array $data, string $period): array
    {
        $baseData = [
            'reportType' => $reportType,
            'period' => $period,
            'generatedAt' => now()->format('Y-m-d H:i:s'),
            'companyName' => auth()->user()->tenant->name ?? 'InsurePal',
            'companyAddress' => auth()->user()->tenant->address ?? '',
        ];

        return array_merge($baseData, $data);
    }

    protected function getViewName(string $reportType): string
    {
        return match ($reportType) {
            'naicom' => 'exports.naicom-pdf',
            'business-overview' => 'exports.business-overview-pdf',
            'customer-analytics' => 'exports.customer-analytics-pdf',
            'product-performance' => 'exports.product-performance-pdf',
            'claims-analytics' => 'exports.claims-analytics-pdf',
            'financial-analytics' => 'exports.financial-analytics-pdf',
            'compliance-dashboard' => 'exports.compliance-dashboard-pdf',
            default => 'exports.default-pdf'
        };
    }
}
