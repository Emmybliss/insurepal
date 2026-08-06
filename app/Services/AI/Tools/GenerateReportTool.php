<?php

namespace App\Services\AI\Tools;

use App\Models\User;
use App\Services\AI\ToolContract;
use App\Services\AI\ToolResult;
use App\Services\ReportService;

class GenerateReportTool implements ToolContract
{
    public function __construct(
        private ReportService $reportService
    ) {}

    public function name(): string
    {
        return 'generate_report';
    }

    public function description(): string
    {
        return 'Generate business, financial, claims, or customer performance metrics and reports';
    }

    public function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'report_type' => ['type' => 'string', 'description' => 'Type of report (business, claims, financial, customer, products)', 'default' => 'business'],
                'start_date' => ['type' => 'string', 'description' => 'Start date (YYYY-MM-DD)'],
                'end_date' => ['type' => 'string', 'description' => 'End date (YYYY-MM-DD)'],
            ],
            'required' => ['report_type'],
        ];
    }

    public function execute(array $params, User $user): ToolResult
    {
        try {
            $startDate = ! empty($params['start_date']) ? \Carbon\Carbon::parse($params['start_date']) : now()->startOfMonth();
            $endDate = ! empty($params['end_date']) ? \Carbon\Carbon::parse($params['end_date']) : now()->endOfDay();

            $reportType = strtolower($params['report_type'] ?? 'business');

            $data = match ($reportType) {
                'business' => $this->reportService->getBusinessMetrics($startDate, $endDate),
                'claims' => $this->reportService->getClaimsMetrics($startDate, $endDate),
                'financial' => $this->reportService->getFinancialMetrics($startDate, $endDate),
                'customer' => $this->reportService->getCustomerMetrics($startDate, $endDate),
                'products' => $this->reportService->getProductPerformance($startDate, $endDate),
                default => $this->reportService->getBusinessMetrics($startDate, $endDate),
            };

            return new ToolResult(
                success: true,
                data: [
                    'report_type' => $reportType,
                    'period' => [
                        'start' => $startDate->format('Y-m-d'),
                        'end' => $endDate->format('Y-m-d'),
                    ],
                    'metrics' => $data,
                ],
                message: 'Generated '.ucfirst($reportType)." Report from {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}."
            );
        } catch (\Exception $e) {
            return new ToolResult(
                success: false,
                data: [],
                message: "Failed to generate report: {$e->getMessage()}",
                error: $e->getMessage()
            );
        }
    }

    public function authorize(User $user): bool
    {
        return $user->tenant_id !== null;
    }

    public function requiresApproval(): bool
    {
        return true;
    }
}
