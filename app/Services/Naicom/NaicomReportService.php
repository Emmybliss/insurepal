<?php

namespace App\Services\Naicom;

use App\Enums\FormType;
use App\Enums\ReportStatus;
use App\Models\NaicomReportLine;
use App\Models\NaicomReportRun;
use Illuminate\Support\Facades\DB;

class NaicomReportService
{
    public function __construct(
        protected NaicomForm72BService $form72BService,
        protected NaicomForm72CService $form72CService,
        protected NaicomForm72AService $form72AService,
    ) {}

    public function generate(NaicomReportRun $run): NaicomReportRun
    {
        $run->update(['status' => ReportStatus::Generating]);

        try {
            DB::transaction(function () use ($run) {
                $run->lines()->whereIn('form_type', [
                    FormType::Form72B->value,
                    FormType::Form72C->value,
                    FormType::Form72A->value,
                ])->delete();

                $this->generateForm72B($run);
                $form72CData = $this->generateForm72C($run);
                $this->generateForm72A($run, $form72CData);
            });

            $run->update(['status' => ReportStatus::Generated]);

        } catch (\Throwable $e) {
            $run->update([
                'status' => ReportStatus::ValidationFailed,
                'metadata' => array_merge($run->metadata ?? [], [
                    'generation_error' => $e->getMessage(),
                ]),
            ]);

            throw $e;
        }

        return $run->fresh();
    }

    protected function generateForm72B(NaicomReportRun $run): void
    {
        $data = $this->form72BService->generateData(
            tenantId: $run->tenant_id,
            reportingYear: $run->reporting_year,
            reportingHalf: $run->reporting_half->value,
            commissionRecognitionDate: $run->commission_recognition_date?->toDateString(),
        );

        $lines = [];

        foreach ($data['rows'] as $index => $row) {
            $lines[] = [
                'report_run_id' => $run->id,
                'form_type' => FormType::Form72B,
                'row_number' => $index + 1,
                'month' => $row['month'],
                'data' => json_encode($row),
                'calculated_amount' => $row['commission_earned'],
            ];
        }

        NaicomReportLine::insert($lines);

        $run->metadata = array_merge($run->metadata ?? [], [
            'form_72b' => [
                'row_count' => count($lines),
                'monthly_summaries' => $data['monthly_summaries'],
                'period' => $data['period'],
            ],
        ]);

        $run->save();
    }

    protected function generateForm72C(NaicomReportRun $run): array
    {
        $data = $this->form72CService->generateData(
            tenantId: $run->tenant_id,
            reportingYear: $run->reporting_year,
            reportingHalf: $run->reporting_half->value,
        );

        $lines = [];

        foreach ($data['rows'] as $index => $row) {
            $lines[] = [
                'report_run_id' => $run->id,
                'form_type' => FormType::Form72C,
                'row_number' => $index + 1,
                'month' => $row['month'],
                'data' => json_encode($row),
                'calculated_amount' => $row['premium_due_to_insurers'],
            ];
        }

        NaicomReportLine::insert($lines);

        $run->metadata = array_merge($run->metadata ?? [], [
            'form_72c' => [
                'row_count' => count($lines),
                'monthly_summaries' => $data['monthly_summaries'],
                'period' => $data['period'],
            ],
        ]);

        $run->save();

        return $data;
    }

    protected function generateForm72A(NaicomReportRun $run, array $form72CData): void
    {
        $data = $this->form72AService->generateData(
            tenantId: $run->tenant_id,
            reportingYear: $run->reporting_year,
            reportingHalf: $run->reporting_half->value,
            form72CRows: $form72CData['rows'] ?? [],
        );

        $lines = [];

        foreach ($data['rows'] as $index => $row) {
            $lines[] = [
                'report_run_id' => $run->id,
                'form_type' => FormType::Form72A,
                'row_number' => $index + 1,
                'month' => $row['month'],
                'data' => json_encode($row),
                'calculated_amount' => $row['total_assets'],
            ];
        }

        NaicomReportLine::insert($lines);

        $run->metadata = array_merge($run->metadata ?? [], [
            'form_72a' => [
                'row_count' => count($lines),
                'monthly_summaries' => $data['monthly_summaries'],
                'period' => $data['period'],
            ],
        ]);

        $run->save();
    }
}
