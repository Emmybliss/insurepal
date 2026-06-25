<?php

namespace App\Services\Exports;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExcelExportService
{
    protected Spreadsheet $spreadsheet;

    protected Worksheet $worksheet;

    protected int $currentRow = 1;

    public function __construct()
    {
        $this->spreadsheet = new Spreadsheet;
        $this->worksheet = $this->spreadsheet->getActiveSheet();
    }

    public function exportReport(string $reportType, array $data, string $period): string
    {
        $this->setupWorksheet($reportType, $period);

        switch ($reportType) {
            case 'naicom':
                return $this->exportNaicomReport($data);
            case 'business-overview':
                return $this->exportBusinessOverview($data);
            case 'customer-analytics':
                return $this->exportCustomerAnalytics($data);
            case 'product-performance':
                return $this->exportProductPerformance($data);
            case 'claims-analytics':
                return $this->exportClaimsAnalytics($data);
            case 'financial-analytics':
                return $this->exportFinancialAnalytics($data);
            case 'compliance-dashboard':
                return $this->exportComplianceDashboard($data);
            default:
                throw new \InvalidArgumentException("Unknown report type: {$reportType}");
        }
    }

    protected function setupWorksheet(string $reportType, string $period): void
    {
        $this->worksheet->setTitle($this->getReportTitle($reportType));
        $this->currentRow = 1;

        // Set column widths
        $this->worksheet->getColumnDimension('A')->setWidth(25);
        $this->worksheet->getColumnDimension('B')->setWidth(20);
        $this->worksheet->getColumnDimension('C')->setWidth(20);
        $this->worksheet->getColumnDimension('D')->setWidth(20);
        $this->worksheet->getColumnDimension('E')->setWidth(20);
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

    protected function addHeader(string $title, string $subtitle = ''): void
    {
        // Main title
        $this->worksheet->setCellValue('A'.$this->currentRow, $title);
        $this->worksheet->mergeCells('A'.$this->currentRow.':E'.$this->currentRow);
        $this->applyHeaderStyle('A'.$this->currentRow);
        $this->currentRow += 2;

        if ($subtitle) {
            $this->worksheet->setCellValue('A'.$this->currentRow, $subtitle);
            $this->worksheet->mergeCells('A'.$this->currentRow.':E'.$this->currentRow);
            $this->applySubtitleStyle('A'.$this->currentRow);
            $this->currentRow += 2;
        }
    }

    protected function addKpiSection(array $kpis): void
    {
        $this->addSectionHeader('Key Performance Indicators');

        $this->worksheet->setCellValue('A'.$this->currentRow, 'Metric');
        $this->worksheet->setCellValue('B'.$this->currentRow, 'Value');
        $this->worksheet->setCellValue('C'.$this->currentRow, 'Trend');
        $this->applyTableHeaderStyle('A'.$this->currentRow.':C'.$this->currentRow);
        $this->currentRow++;

        foreach ($kpis as $kpi) {
            $this->worksheet->setCellValue('A'.$this->currentRow, $kpi['title']);
            $this->worksheet->setCellValue('B'.$this->currentRow, $kpi['value']);
            $this->worksheet->setCellValue('C'.$this->currentRow, $kpi['trend'] ?? '');
            $this->applyTableRowStyle('A'.$this->currentRow.':C'.$this->currentRow);
            $this->currentRow++;
        }
        $this->currentRow++;
    }

    protected function addDataTable(array $headers, array $data): void
    {
        // Headers
        $col = 'A';
        foreach ($headers as $header) {
            $this->worksheet->setCellValue($col.$this->currentRow, $header);
            $col++;
        }
        $this->applyTableHeaderStyle('A'.$this->currentRow.':'.chr(ord('A') + count($headers) - 1).$this->currentRow);
        $this->currentRow++;

        // Data rows
        foreach ($data as $row) {
            $col = 'A';
            foreach ($row as $value) {
                $this->worksheet->setCellValue($col.$this->currentRow, $value);
                $col++;
            }
            $this->applyTableRowStyle('A'.$this->currentRow.':'.chr(ord('A') + count($headers) - 1).$this->currentRow);
            $this->currentRow++;
        }
        $this->currentRow++;
    }

    protected function addSectionHeader(string $title): void
    {
        $this->worksheet->setCellValue('A'.$this->currentRow, $title);
        $this->worksheet->mergeCells('A'.$this->currentRow.':E'.$this->currentRow);
        $this->applySectionHeaderStyle('A'.$this->currentRow);
        $this->currentRow++;
    }

    protected function exportNaicomReport(array $data): string
    {
        $this->addHeader('NAICOM Compliance Report', 'Generated on '.now()->format('Y-m-d H:i:s'));

        // Company Information
        $this->addSectionHeader('Company Information');
        $companyInfo = [
            ['Company Name', $data['company_info']['name'] ?? ''],
            ['Registration Number', $data['company_info']['registration_number'] ?? ''],
            ['License Number', $data['company_info']['license_number'] ?? ''],
            ['Address', $data['company_info']['address'] ?? ''],
            ['Phone', $data['company_info']['phone'] ?? ''],
            ['Email', $data['company_info']['email'] ?? ''],
        ];
        $this->addDataTable(['Field', 'Value'], $companyInfo);

        // Financial Summary
        $this->addSectionHeader('Financial Summary');
        $financialSummary = [
            ['Gross Premium Written', '₦'.number_format($data['financial_summary']['gross_premium_written'] ?? 0, 2)],
            ['Net Premium Written', '₦'.number_format($data['financial_summary']['net_premium_written'] ?? 0, 2)],
            ['Commission Paid', '₦'.number_format($data['financial_summary']['commission_paid'] ?? 0, 2)],
            ['Premium Refunded', '₦'.number_format($data['financial_summary']['premium_refunded'] ?? 0, 2)],
            ['Outstanding Premiums', '₦'.number_format($data['financial_summary']['outstanding_premiums'] ?? 0, 2)],
        ];
        $this->addDataTable(['Metric', 'Amount'], $financialSummary);

        // Policy Statistics
        if (isset($data['policy_stats']) && is_array($data['policy_stats'])) {
            $this->addSectionHeader('Policy Statistics by Product');
            $policyData = [];
            foreach ($data['policy_stats'] as $policy) {
                $policyData[] = [
                    $policy->class_of_business ?? '',
                    $policy->product_name ?? '',
                    $policy->policy_count ?? 0,
                    '₦'.number_format($policy->total_premium ?? 0, 2),
                    '₦'.number_format($policy->average_premium ?? 0, 2),
                ];
            }
            $this->addDataTable(['Class of Business', 'Product Name', 'Policy Count', 'Total Premium', 'Average Premium'], $policyData);
        }

        return $this->generateFile();
    }

    protected function exportBusinessOverview(array $data): string
    {
        $this->addHeader('Business Overview Report', 'Generated on '.now()->format('Y-m-d H:i:s'));

        // KPIs
        $kpis = [
            ['Total Premium', '₦'.number_format($data['total_premium'] ?? 0, 2), '+12.5%'],
            ['Active Policies', number_format($data['active_policies'] ?? 0), '+8.2%'],
            ['Total Customers', number_format($data['total_customers'] ?? 0), '+15.3%'],
            ['Commission Earned', '₦'.number_format($data['total_commission'] ?? 0, 2), '+6.7%'],
        ];
        $this->addKpiSection($kpis);

        // Performance Metrics
        $this->addSectionHeader('Performance Metrics');
        $performanceData = [
            ['Renewal Rate', number_format(($data['policy_renewals'] / max($data['active_policies'], 1)) * 100, 1).'%'],
            ['Cancellation Rate', number_format(($data['policy_cancellations'] / max($data['active_policies'], 1)) * 100, 1).'%'],
            ['Outstanding Premiums', '₦'.number_format($data['outstanding_premiums'] ?? 0, 2)],
            ['Financial Notes Issued', ($data['debit_notes_issued'] ?? 0) + ($data['credit_notes_issued'] ?? 0)],
        ];
        $this->addDataTable(['Metric', 'Value'], $performanceData);

        return $this->generateFile();
    }

    protected function exportCustomerAnalytics(array $data): string
    {
        $this->addHeader('Customer Analytics Report', 'Generated on '.now()->format('Y-m-d H:i:s'));

        // Customer KPIs
        $kpis = [
            ['Total Customers', number_format($data['total_customers'] ?? 0), '+8.5%'],
            ['New Customers', number_format($data['new_customers'] ?? 0), '+12.3%'],
            ['Retention Rate', number_format($data['customer_retention_rate'] ?? 0, 1).'%', '+2.1%'],
            ['Avg Policies per Customer', number_format($data['avg_policies_per_customer'] ?? 0, 1), '+5.7%'],
        ];
        $this->addKpiSection($kpis);

        // Customer Segmentation
        $this->addSectionHeader('Customer Segmentation');
        $segmentationData = [
            ['Individual Customers', number_format($data['individual_customers'] ?? 0), number_format((($data['individual_customers'] ?? 0) / max($data['total_customers'], 1)) * 100, 1).'%'],
            ['Corporate Customers', number_format($data['corporate_customers'] ?? 0), number_format((($data['corporate_customers'] ?? 0) / max($data['total_customers'], 1)) * 100, 1).'%'],
            ['Customers with Policies', number_format($data['customers_with_policies'] ?? 0), number_format((($data['customers_with_policies'] ?? 0) / max($data['total_customers'], 1)) * 100, 1).'%'],
            ['Customers without Policies', number_format($data['customers_without_policies'] ?? 0), number_format((($data['customers_without_policies'] ?? 0) / max($data['total_customers'], 1)) * 100, 1).'%'],
        ];
        $this->addDataTable(['Segment', 'Count', 'Percentage'], $segmentationData);

        return $this->generateFile();
    }

    protected function exportProductPerformance(array $data): string
    {
        $this->addHeader('Product Performance Report', 'Generated on '.now()->format('Y-m-d H:i:s'));

        // Product KPIs
        $kpis = [
            ['Total Premium', '₦'.number_format($data['total_premium'] ?? 0, 2), '+12.5%'],
            ['Total Policies', number_format($data['total_policies'] ?? 0), '+8.2%'],
            ['Avg Premium per Policy', '₦'.number_format($data['avg_premium_per_policy'] ?? 0, 2), '+5.7%'],
            ['Total Commission', '₦'.number_format($data['total_commission'] ?? 0, 2), '+6.3%'],
        ];
        $this->addKpiSection($kpis);

        // Performance Metrics
        $this->addSectionHeader('Performance Metrics');
        $performanceData = [
            ['Loss Ratio', number_format($data['loss_ratio'] ?? 0, 1).'%'],
            ['Expense Ratio', number_format($data['expense_ratio'] ?? 0, 1).'%'],
            ['Combined Ratio', number_format($data['combined_ratio'] ?? 0, 1).'%'],
        ];
        $this->addDataTable(['Metric', 'Value'], $performanceData);

        return $this->generateFile();
    }

    protected function exportClaimsAnalytics(array $data): string
    {
        $this->addHeader('Claims Analytics Report', 'Generated on '.now()->format('Y-m-d H:i:s'));

        // Claims KPIs
        $kpis = [
            ['Total Claims', number_format($data['total_claims'] ?? 0), '-5.2%'],
            ['Settlement Ratio', number_format($data['settlement_ratio'] ?? 0, 1).'%', '+2.1%'],
            ['Average Claim Amount', '₦'.number_format($data['average_claim_amount'] ?? 0, 2), '-8.7%'],
            ['Total Settled Amount', '₦'.number_format($data['total_settled_amount'] ?? 0, 2), '+12.3%'],
        ];
        $this->addKpiSection($kpis);

        // Claims Status
        $this->addSectionHeader('Claims Status Overview');
        $statusData = [
            ['Settled Claims', number_format($data['settled_claims'] ?? 0), number_format((($data['settled_claims'] ?? 0) / max($data['total_claims'], 1)) * 100, 1).'%'],
            ['Pending Claims', number_format($data['pending_claims'] ?? 0), 'Awaiting review'],
            ['Rejected Claims', number_format($data['rejected_claims'] ?? 0), number_format((($data['rejected_claims'] ?? 0) / max($data['total_claims'], 1)) * 100, 1).'%'],
        ];
        $this->addDataTable(['Status', 'Count', 'Percentage'], $statusData);

        return $this->generateFile();
    }

    protected function exportFinancialAnalytics(array $data): string
    {
        $this->addHeader('Financial Analytics Report', 'Generated on '.now()->format('Y-m-d H:i:s'));

        // Financial KPIs
        $kpis = [
            ['Total Revenue', '₦'.number_format($data['total_revenue'] ?? 0, 2), '+15.2%'],
            ['Net Profit', '₦'.number_format($data['net_profit'] ?? 0, 2), '+8.7%'],
            ['Loss Ratio', number_format($data['loss_ratio'] ?? 0, 1).'%', '-2.3%'],
            ['Combined Ratio', number_format($data['combined_ratio'] ?? 0, 1).'%', '-1.8%'],
        ];
        $this->addKpiSection($kpis);

        // Financial Metrics
        $this->addSectionHeader('Financial Metrics');
        $financialData = [
            ['Profit Margin', number_format($data['profit_margin'] ?? 0, 1).'%'],
            ['Expense Ratio', number_format($data['expense_ratio'] ?? 0, 1).'%'],
            ['Total Expenses', '₦'.number_format($data['total_expenses'] ?? 0, 2)],
        ];
        $this->addDataTable(['Metric', 'Value'], $financialData);

        return $this->generateFile();
    }

    protected function exportComplianceDashboard(array $data): string
    {
        $this->addHeader('Compliance Dashboard Report', 'Generated on '.now()->format('Y-m-d H:i:s'));

        // Compliance KPIs
        $kpis = [
            ['Capital Adequacy Ratio', number_format($data['capital_adequacy_ratio'] ?? 0, 1).'%', '+5.2%'],
            ['RBC Ratio', number_format($data['rbc_ratio'] ?? 0, 1).'%', '+3.1%'],
            ['Available Capital', '₦'.number_format($data['available_capital'] ?? 0, 2), '+8.7%'],
            ['Compliance Score', number_format($data['compliance_score'] ?? 0, 1).'/10', '+1.2%'],
        ];
        $this->addKpiSection($kpis);

        // Compliance Status
        $this->addSectionHeader('Compliance Status');
        $complianceData = [
            ['Outstanding Submissions', $data['outstanding_submissions'] ?? 0],
            ['Upcoming Deadlines', $data['upcoming_deadlines'] ?? 0],
            ['MCR Compliance', ($data['available_capital'] ?? 0) >= ($data['minimum_capital_requirement'] ?? 0) ? 'Compliant' : 'Non-Compliant'],
        ];
        $this->addDataTable(['Metric', 'Value'], $complianceData);

        return $this->generateFile();
    }

    protected function generateFile(): string
    {
        $filename = 'report_'.now()->format('Y_m_d_H_i_s').'.xlsx';
        $filepath = storage_path('app/exports/'.$filename);

        // Ensure directory exists
        if (! file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        $writer = new Xlsx($this->spreadsheet);
        $writer->save($filepath);

        return $filepath;
    }

    protected function applyHeaderStyle(string $cell): void
    {
        $this->worksheet->getStyle($cell)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 16,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2E86AB'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
    }

    protected function applySubtitleStyle(string $cell): void
    {
        $this->worksheet->getStyle($cell)->applyFromArray([
            'font' => [
                'size' => 12,
                'italic' => true,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);
    }

    protected function applySectionHeaderStyle(string $cell): void
    {
        $this->worksheet->getStyle($cell)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 14,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'A23B72'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
            ],
        ]);
    }

    protected function applyTableHeaderStyle(string $range): void
    {
        $this->worksheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F18F01'],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);
    }

    protected function applyTableRowStyle(string $range): void
    {
        $this->worksheet->getStyle($range)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC'],
                ],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
            ],
        ]);
    }
}
