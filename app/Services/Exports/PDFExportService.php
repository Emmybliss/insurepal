<?php

namespace App\Services\Exports;

use Barryvdh\DomPDF\Facade\Pdf;

class PDFExportService
{
    public function exportReport(string $reportType, array $data, string $period): string
    {
        $viewData = $this->prepareViewData($reportType, $data, $period);
        $view = $this->getViewName($reportType);

        $pdf = Pdf::loadView($view, $viewData);
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'Arial',
        ]);

        $filename = 'report_'.$reportType.'_'.now()->format('Y_m_d_H_i_s').'.pdf';
        $filepath = storage_path('app/exports/'.$filename);

        // Ensure directory exists
        if (! file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        $pdf->save($filepath);

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
