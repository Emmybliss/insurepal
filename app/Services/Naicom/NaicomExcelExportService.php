<?php

namespace App\Services\Naicom;

use App\Models\NaicomReportRun;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class NaicomExcelExportService
{
    private const EXPORT_DIR = 'storage/app/exports/naicom';

    public function export(NaicomReportRun $run, string $form, ?int $userId = null): string
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($form);

        $lines = $run->lines()
            ->where('form_type', $form)
            ->orderBy('row_number')
            ->get();

        match ($form) {
            '7.2A' => $this->buildForm72A($sheet, $run, $lines),
            '7.2B' => $this->buildForm72B($sheet, $run, $lines),
            '7.2C' => $this->buildForm72C($sheet, $run, $lines),
            default => throw new \InvalidArgumentException("Unknown form: {$form}"),
        };

        if (! is_dir(base_path(self::EXPORT_DIR))) {
            mkdir(base_path(self::EXPORT_DIR), 0755, true);
        }

        $filename = "naicom_{$run->id}_{$form}_".now()->format('Ymd_His').'.xlsx';
        $outputPath = base_path(self::EXPORT_DIR."/{$filename}");

        $writer = new Xlsx($spreadsheet);
        $writer->save($outputPath);
        $spreadsheet->disconnectWorksheets();

        $checksum = hash('sha256', file_get_contents($outputPath));
        $this->logExport($run, $form, $filename, $outputPath, $checksum, $userId);

        return $outputPath;
    }

    private function buildForm72A(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        NaicomReportRun $run,
        \Illuminate\Support\Collection $lines,
    ): void {
        $half = $run->reporting_half?->value ?? 'H1';
        $halfOrdinal = $half === 'H1' ? '1ST' : '2ND';
        $year = $run->reporting_year;
        $halfEnd = $half === 'H1' ? "30TH JUNE {$year}" : "31ST DECEMBER {$year}";
        $tenant = $run->tenant;

        $months = $half === 'H1'
            ? ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE']
            : ['JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

        $sheet->setCellValue('A1', 'FORM 7.2A');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->setCellValue('A2', $tenant?->name ?? '');
        $sheet->getStyle('A2')->getFont()->setBold(true);
        $sheet->setCellValue('A3', "UNAUDITED BALANCE SHEET OF CLIENTS ACCOUNT FOR {$halfOrdinal}  HALF YEAR ENDED {$halfEnd}");
        $sheet->getStyle('A3')->getFont()->setSize(10);

        $sheet->setCellValue('A5', 'ASSETS');
        $sheet->getStyle('A5')->getFont()->setBold(true);

        foreach ($months as $i => $month) {
            $col = chr(66 + $i);
            $sheet->setCellValue("{$col}6", $month);
            $sheet->getStyle("{$col}6")->getFont()->setBold(true);
        }

        $assetLabels = [
            7 => 'CASH IN HAND',
            8 => 'CHEQUE IN HAND',
            9 => 'BANK BALANCE',
        ];

        foreach ($assetLabels as $row => $label) {
            $sheet->setCellValue("A{$row}", $label);
        }

        $liabilitiesLabels = [
            14 => 'PREMIUM AWAITING REMITTANCE',
            15 => 'COMMISSION AWAITING REMITTANCE (CO-BROKERS)',
            16 => 'COMMISSION AWAITING REMITTANCE (REPORTING BROKER)',
            17 => 'VAT DEDUCTED AWAITING REMITTANCE',
            18 => 'OTHERS',
        ];

        $sheet->setCellValue('A13', 'LIABILITIES');
        $sheet->getStyle('A13')->getFont()->setBold(true);

        foreach ($liabilitiesLabels as $row => $label) {
            $sheet->setCellValue("A{$row}", $label);
        }

        $monthCols = ['B', 'C', 'D', 'E', 'F', 'G'];

        foreach ($lines as $line) {
            $data = $line->data;
            $excelRow = match ($line->row_number) {
                1 => 7, 2 => 8, 3 => 9,
                5 => 14, 6 => 15, 7 => 16, 8 => 17, 9 => 18,
                default => null,
            };
            if ($excelRow === null) {
                continue;
            }
            $valueKey = match ($line->row_number) {
                1 => 'cash_in_hand', 2 => 'cheque_in_hand', 3 => 'bank_balance',
                5 => 'premium_awaiting_remittance', 6 => 'commission_awaiting_co_broker',
                7 => 'commission_awaiting_reporting_broker', 8 => 'vat_deducted_awaiting',
                9 => 'others',
                default => 'value',
            };
            $monthlyValues = $data[$valueKey] ?? (is_array($data) && isset($data['monthly']) ? $data['monthly'] : []);
            if (is_array($monthlyValues)) {
                foreach ($monthlyValues as $mi => $mv) {
                    if (isset($monthCols[$mi])) {
                        $this->setNumeric($sheet, "{$monthCols[$mi]}{$excelRow}", $mv);
                    }
                }
            }
        }

        $row10labels = ['B10', 'C10', 'D10', 'E10', 'F10', 'G10'];
        $row19labels = ['B19', 'C19', 'D19', 'E19', 'F19', 'G19'];
        foreach ($monthCols as $col) {
            $sheet->setCellValue("{$col}10", "=SUM({$col}7:{$col}9)");
            $sheet->getStyle("{$col}10")->getFont()->setBold(true);
            $sheet->setCellValue("{$col}19", "=SUM({$col}14:{$col}18)");
            $sheet->getStyle("{$col}19")->getFont()->setBold(true);
        }

        $sheet->setCellValue('A10', 'TOTAL ASSETS');
        $sheet->getStyle('A10')->getFont()->setBold(true);
        $sheet->setCellValue('A19', 'TOTAL LIABILITIES');
        $sheet->getStyle('A19')->getFont()->setBold(true);

        $sheet->getColumnDimension('A')->setWidth(45);
        foreach ($monthCols as $col) {
            $sheet->getColumnDimension($col)->setWidth(18);
        }

        $sheet->getPageSetup()->setPrintArea('A1:G19');
    }

    private function buildForm72B(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        NaicomReportRun $run,
        \Illuminate\Support\Collection $lines,
    ): void {
        $half = $run->reporting_half?->value ?? 'H1';
        $halfOrdinal = $half === 'H1' ? '1st' : '2nd';
        $year = $run->reporting_year;
        $halfEnd = $half === 'H1' ? "30TH JUNE {$year}" : "31ST DECEMBER {$year}";
        $periodStart = $half === 'H1' ? "1ST JANUARY {$year}" : "1ST JULY {$year}";
        $periodEnd = $halfEnd;
        $tenant = $run->tenant;

        $sheet->setCellValue('A1', ($tenant?->name ?? '').'  FORM 7.2B');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);
        $sheet->setCellValue('A2', "STATEMENT OF BUSINESS GENERATED IN THE {$halfOrdinal} HALF OF ENDED {$halfEnd}");
        $sheet->getStyle('A2')->getFont()->setSize(10);
        $sheet->setCellValue('A3', "REPORTING PERIOD:{$periodStart} TO {$periodEnd}");
        $sheet->getStyle('A3')->getFont()->setSize(9);

        $headerRow4 = [
            'G' => 'GROSS/NET PREMIUM',
            'M' => 'PREMIUM RECEIVED BY REPORTING BROKER',
            'P' => 'COMMISSION INCOME DUE TO CO - BROKERS AND REPORTING BROKER',
        ];
        foreach ($headerRow4 as $col => $text) {
            $sheet->setCellValue("{$col}4", $text);
            $sheet->getStyle("{$col}4")->getFont()->setBold(true)->setSize(8);
            $sheet->getStyle("{$col}4")->getAlignment()->setTextRotation(90);
        }

        $columns = [
            'A' => 'MONTH', 'B' => 'S/N', 'C' => 'NAME OF INSURED',
            'D' => 'NAME OF INSURER', 'E' => 'COVER START DATE', 'F' => 'COVER END DATE',
            'G' => 'SUM INSURED', 'H' => 'PREMIUM PAID DIRECT TO INSURERS',
            'I' => 'PREMIUM PAID TO BROKER (LOCAL)', 'J' => 'PREMIUM PAID TO BROKER (FOREIGN)',
            'K' => 'TOTAL GROSS PREMIUM', 'L' => 'NET PREMIUM (EXCL. TOTAL COMMISSION)',
            'M' => 'PAYMENT METHOD', 'N' => 'DATE RECEIVED',
            'O' => 'PREMUIM RECEIVED BY BROKER FROM INSURED',
            'P' => 'TOTAL COMMISSION FEE INCOME',
            'Q' => 'COMMISSION DUE TO CO-BROKERS',
            'R' => 'COMMISSION DUE TO REPORTING BROKERS',
            'S' => 'COMMISSION INCOME EARNED (REPORTING BROKERS)',
            'T' => 'DEFERRED COMMISSION INCOME (REPORTING BROKERS)',
        ];

        $row = 6;
        foreach ($columns as $col => $label) {
            $sheet->setCellValue("{$col}{$row}", $label);
            $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true)->setSize(7);
        }

        $dataStartRow = 7;
        $currentRow = $dataStartRow;

        foreach ($lines as $line) {
            $data = $line->data;

            $sheet->setCellValue("A{$currentRow}", $this->monthName($line->month));
            $sheet->setCellValueExplicit("B{$currentRow}", (int) ($data['serial_number'] ?? $line->row_number), DataType::TYPE_NUMERIC);
            $sheet->setCellValue("C{$currentRow}", $data['customer_name'] ?? '');
            $sheet->setCellValue("D{$currentRow}", $data['insurer_name'] ?? '');
            $sheet->setCellValue("E{$currentRow}", $data['cover_start'] ?? '');
            $sheet->setCellValue("F{$currentRow}", $data['cover_end'] ?? '');
            $this->setNumeric($sheet, "G{$currentRow}", $data['sum_insured'] ?? 0);
            $this->setNumeric($sheet, "H{$currentRow}", $data['premium_direct_to_insurers'] ?? 0);
            $this->setNumeric($sheet, "I{$currentRow}", $data['premium_to_broker_local'] ?? 0);
            $this->setNumeric($sheet, "J{$currentRow}", $data['premium_to_broker_foreign'] ?? 0);
            $this->setNumeric($sheet, "K{$currentRow}", $data['total_gross_premium'] ?? 0);
            $this->setNumeric($sheet, "L{$currentRow}", $data['net_premium'] ?? 0);
            $sheet->setCellValue("M{$currentRow}", $data['payment_method'] ?? '');
            $sheet->setCellValue("N{$currentRow}", $data['payment_date'] ?? '');
            $this->setNumeric($sheet, "O{$currentRow}", $data['premium_received_by_broker'] ?? 0);
            $this->setNumeric($sheet, "P{$currentRow}", $data['total_commission'] ?? 0);
            $this->setNumeric($sheet, "Q{$currentRow}", $data['co_broker_commission'] ?? 0);
            $this->setNumeric($sheet, "R{$currentRow}", $data['reporting_broker_commission'] ?? 0);
            $this->setNumeric($sheet, "S{$currentRow}", $data['commission_earned'] ?? 0);
            $this->setNumeric($sheet, "T{$currentRow}", $data['commission_deferred'] ?? 0);

            $currentRow++;
        }

        $grandTotalRow = $currentRow;
        $lastDataRow = $grandTotalRow - 1;
        $sheet->setCellValue("C{$grandTotalRow}", 'GRAND TOTAL');
        $sheet->getStyle("C{$grandTotalRow}")->getFont()->setBold(true);

        $sumCols = ['H', 'I', 'K', 'L', 'O', 'P', 'Q', 'R', 'S', 'T'];
        foreach ($sumCols as $col) {
            $sheet->setCellValue("{$col}{$grandTotalRow}", "=SUM({$col}{$dataStartRow}:{$col}{$lastDataRow})");
            $sheet->getStyle("{$col}{$grandTotalRow}")->getFont()->setBold(true);
        }

        $this->setColumnWidths($sheet, [
            'A' => 12, 'B' => 6, 'C' => 30, 'D' => 20, 'E' => 16, 'F' => 14,
            'G' => 14, 'H' => 16, 'I' => 16, 'J' => 16, 'K' => 16, 'L' => 16,
            'M' => 14, 'N' => 16, 'O' => 16, 'P' => 16, 'Q' => 16, 'R' => 16,
            'S' => 18, 'T' => 18,
        ]);

        $sheet->getPageSetup()->setPrintArea("A1:T{$grandTotalRow}");
    }

    private function buildForm72C(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        NaicomReportRun $run,
        \Illuminate\Support\Collection $lines,
    ): void {
        $half = $run->reporting_half?->value ?? 'H1';
        $halfOrdinal = $half === 'H1' ? '1st' : '2nd';
        $year = $run->reporting_year;
        $halfEnd = $half === 'H1' ? "30TH JUNE {$year}" : "31ST DECEMBER {$year}";
        $tenant = $run->tenant;

        $sheet->setCellValue('A1', 'FORM 7.2C');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->setCellValue('A2', $tenant?->name ?? '');
        $sheet->getStyle('A2')->getFont()->setBold(true);
        $sheet->setCellValue('A3', "SCHEDULE OF REMITTANCE IN RESPECT OF BUSINESS GENERATED IN {$halfOrdinal} HALF OF ENDED {$halfEnd}");
        $sheet->getStyle('A3')->getFont()->setSize(10);

        $groupHeaders = [
            'G' => 'PREMIUM RECEIVED AND AMOUNTS DUE TO STATEHOLDERS',
            'O' => 'REMITTANCE TO STATEHOLDERS',
            'U' => 'OUTSTANDING PAYMENT',
        ];
        foreach ($groupHeaders as $col => $text) {
            $sheet->setCellValue("{$col}4", $text);
            $sheet->getStyle("{$col}4")->getFont()->setBold(true)->setSize(8);
            $sheet->getStyle("{$col}4")->getAlignment()->setTextRotation(90);
        }

        $columns = [
            'A' => 'MONTH', 'B' => 'S/N', 'C' => 'NAME OF INSURED/POLICY NO',
            'D' => 'NAME OF INSURER', 'E' => 'COVER START DATE', 'F' => 'COVER END DATE',
            'G' => 'TOTAL PREMIUM /CLAIM RECEIVED BY THE BROKERS',
            'H' => 'PREMIUM DUE TO INSURERS (NET OF VAT)',
            'I' => 'DEPOSIT MADE INTO CLIENT ACCOUNT BY INSURED',
            'J' => 'RETURNED PREMIUM DUE TO INSURED',
            'K' => 'CLAIMS DUE TO INSURED',
            'L' => 'VAT DUE TO FIRS/SIRS',
            'M' => 'COMMISSION DUE TO CO-BROKERS',
            'N' => 'COMMISSION DUE TO REPORTING BROKERS',
            'O' => 'DATE REMITTED',
            'P' => 'CLIENT ACCOUNT PAYING BANK',
            'Q' => 'PREMIUM REMITTED TO INSURERS',
            'R' => 'CLAIM/RETURN/DEPOSIT REMITTED TO INSURED',
            'S' => 'VAT REMITTED TO FIRS/SIRS',
            'T' => 'COMMISSION REMITTED TO CO-BROKERS AND REPORTING BROKERS',
            'U' => 'OUTSTANDING PREMIUM DUE TO INSURERS',
            'V' => 'OUTSTANDING CLAIM/RETURN/DEPOSIT DUE TO INSURED',
            'W' => 'OUTSTANDING VAT DUE TO FIRS/SIRS',
            'X' => 'OUTSTANDING COMMISSION DUE TO CO-BROKER AND REPORTING BROKER',
        ];

        $row = 6;
        foreach ($columns as $col => $label) {
            $sheet->setCellValue("{$col}{$row}", $label);
            $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true)->setSize(7);
            $sheet->getStyle("{$col}{$row}")->getAlignment()->setWrapText(true);
        }

        $sheet->setCellValue('E7', 'START DATE');
        $sheet->setCellValue('F7', 'END DATE');

        $dataStartRow = 8;
        $currentRow = $dataStartRow;

        foreach ($lines as $line) {
            $data = $line->data;
            $rowNum = $line->row_number;

            $sheet->setCellValue("A{$currentRow}", $this->monthName($line->month));
            $sheet->setCellValueExplicit("B{$currentRow}", (int) ($data['serial_number'] ?? $rowNum), DataType::TYPE_NUMERIC);
            $sheet->setCellValue("C{$currentRow}", ($data['customer_name'] ?? '').' / '.($data['policy_number'] ?? ''));
            $sheet->setCellValue("D{$currentRow}", $data['insurer_name'] ?? '');
            $sheet->setCellValue("E{$currentRow}", $data['cover_start'] ?? '');
            $sheet->setCellValue("F{$currentRow}", $data['cover_end'] ?? '');
            $this->setNumeric($sheet, "G{$currentRow}", $data['total_received'] ?? 0);
            $this->setNumeric($sheet, "H{$currentRow}", $data['premium_due_to_insurers'] ?? 0);
            $this->setNumeric($sheet, "I{$currentRow}", $data['deposit_made'] ?? 0);
            $this->setNumeric($sheet, "J{$currentRow}", $data['returned_premium_due'] ?? 0);
            $this->setNumeric($sheet, "K{$currentRow}", $data['claims_due_to_insured'] ?? 0);
            $this->setNumeric($sheet, "L{$currentRow}", $data['vat_due'] ?? 0);
            $this->setNumeric($sheet, "M{$currentRow}", $data['commission_due_co_broker'] ?? 0);
            $this->setNumeric($sheet, "N{$currentRow}", $data['commission_due_reporting_broker'] ?? 0);
            $sheet->setCellValue("O{$currentRow}", $data['remittance_date'] ?? '');
            $sheet->setCellValue("P{$currentRow}", $data['bank_name'] ?? '');
            $this->setNumeric($sheet, "Q{$currentRow}", $data['premium_remitted'] ?? 0);
            $this->setNumeric($sheet, "R{$currentRow}", $data['claim_return_deposit_remitted'] ?? 0);
            $this->setNumeric($sheet, "S{$currentRow}", $data['vat_remitted'] ?? 0);
            $this->setNumeric($sheet, "T{$currentRow}", $data['commission_remitted'] ?? 0);
            $this->setNumeric($sheet, "U{$currentRow}", $data['outstanding_premium'] ?? 0);
            $this->setNumeric($sheet, "V{$currentRow}", $data['outstanding_claim_return_deposit'] ?? 0);
            $this->setNumeric($sheet, "W{$currentRow}", $data['outstanding_vat'] ?? 0);
            $this->setNumeric($sheet, "X{$currentRow}", $data['outstanding_commission'] ?? 0);

            $currentRow++;
        }

        $grandTotalRow = $currentRow;
        $lastDataRow = $grandTotalRow - 1;

        $sheet->setCellValue("A{$grandTotalRow}", 'GRAND TOTAL');
        $sheet->getStyle("A{$grandTotalRow}")->getFont()->setBold(true);

        $sumCols = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'];
        foreach ($sumCols as $col) {
            $sheet->setCellValue("{$col}{$grandTotalRow}", "=SUM({$col}{$dataStartRow}:{$col}{$lastDataRow})");
            $sheet->getStyle("{$col}{$grandTotalRow}")->getFont()->setBold(true);
        }

        $this->setColumnWidths($sheet, [
            'A' => 10, 'B' => 5, 'C' => 28, 'D' => 18, 'E' => 14, 'F' => 12,
            'G' => 16, 'H' => 16, 'I' => 14, 'J' => 14, 'K' => 14, 'L' => 14,
            'M' => 16, 'N' => 16, 'O' => 14, 'P' => 18, 'Q' => 16, 'R' => 18,
            'S' => 14, 'T' => 18, 'U' => 16, 'V' => 18, 'W' => 14, 'X' => 18,
        ]);

        $sheet->getPageSetup()->setPrintArea("A1:X{$grandTotalRow}");
    }

    private function setNumeric(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, string $cell, float|int|string $value): void
    {
        $sheet->setCellValueExplicit($cell, (float) $value, DataType::TYPE_NUMERIC);
        $sheet->getStyle($cell)->getNumberFormat()->setFormatCode('#,##0.00');
    }

    private function setColumnWidths(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, array $widths): void
    {
        foreach ($widths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }
    }

    private function monthName(?int $month): string
    {
        return match ($month) {
            1 => 'JANUARY', 2 => 'FEBRUARY', 3 => 'MARCH', 4 => 'APRIL',
            5 => 'MAY', 6 => 'JUNE', 7 => 'JULY', 8 => 'AUGUST',
            9 => 'SEPTEMBER', 10 => 'OCTOBER', 11 => 'NOVEMBER', 12 => 'DECEMBER',
            default => '',
        };
    }

    private function logExport(NaicomReportRun $run, string $form, string $filename, string $path, string $checksum, ?int $userId = null): void
    {
        $metadata = $run->metadata ?? [];
        $metadata['exports'] = array_merge($metadata['exports'] ?? [], [[
            'form' => $form,
            'path' => $path,
            'filename' => $filename,
            'checksum' => $checksum,
            'exported_by' => $userId ?? auth()->id(),
            'exported_at' => now()->toDateTimeString(),
        ]]);
        $run->update(['metadata' => $metadata]);
    }

    public function downloadResponse(string $filePath): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        return response()->download($filePath)->deleteFileAfterSend(true);
    }
}
