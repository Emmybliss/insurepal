<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class NaicomPrepareTemplates extends Command
{
    protected $signature = 'naicom:prepare-templates';

    protected $description = 'Clean and prepare NAICOM Excel templates for export';

    private const SOURCE_DIR = 'resources/templates/naicom/NAICOMFORM';

    private const TARGET_DIR = 'storage/app/templates/naicom/version-1';

    private array $forms = [
        '7.2A' => ['source' => '7.2A.xlsx', 'sheet_rename' => ['Sheet3' => '7.2A']],
        '7.2B' => ['source' => '7.2B.xlsx', 'sheet_rename' => ['Sheet2' => '7.2B']],
        '7.2C' => ['source' => '7.2C.xlsx', 'sheet_rename' => ['Sheet1' => '7.2C']],
    ];

    public function handle(): void
    {
        $targetDir = base_path(self::TARGET_DIR);
        if (! is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        foreach ($this->forms as $form => $config) {
            $sourcePath = base_path(self::SOURCE_DIR.$config['source']);
            if (! file_exists($sourcePath)) {
                $this->warn("Source template for Form {$form} not found at {$sourcePath}, skipping.");

                continue;
            }

            $this->info("Processing Form {$form}...");
            $spreadsheet = IOFactory::load($sourcePath);

            foreach ($config['sheet_rename'] as $old => $new) {
                if ($spreadsheet->sheetNameExists($old)) {
                    $spreadsheet->setActiveSheetIndexByName($old);
                    $spreadsheet->getActiveSheet()->setTitle($new);
                    $this->line("  Renamed sheet '{$old}' → '{$new}'");
                }
            }

            $sheet = $spreadsheet->getActiveSheet();

            $this->cleanPlaceholders($sheet);
            $this->setPrintArea($sheet, $form);
            $this->applyNumberFormats($sheet, $form);
            $this->addMissingFormulas($sheet, $form);

            $outputPath = $targetDir.'/NAICOMFORM'.$config['source'];
            $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
            $writer->save($outputPath);
            $spreadsheet->disconnectWorksheets();

            $this->info("  Saved to {$outputPath}");
        }

        $this->newLine();
        $this->info('All templates prepared successfully.');
    }

    private function cleanPlaceholders(Worksheet $sheet): void
    {
        $replacements = ['___', 'TBA', '__'];
        foreach ($sheet->getRowIterator() as $row) {
            foreach ($row->getCellIterator() as $cell) {
                $value = $cell->getValue();
                if (is_string($value)) {
                    $trimmed = trim($value);
                    if (in_array($trimmed, $replacements, true)) {
                        $cell->setValue(0);
                    } elseif (str_contains($trimmed, '___')) {
                        $cell->setValue(0);
                    } elseif ($trimmed === '#') {
                        $cell->setValue('');
                    }
                }
            }
        }
    }

    private function setPrintArea(Worksheet $sheet, string $form): void
    {
        $lastRow = $sheet->getHighestRow();
        $lastCol = $form === '7.2A' ? 'G' : ($form === '7.2B' ? 'T' : 'X');
        $sheet->getPageSetup()->setPrintArea("A1:{$lastCol}{$lastRow}");
    }

    private function applyNumberFormats(Worksheet $sheet, string $form): void
    {
        $lastRow = $sheet->getHighestRow();

        if ($form === '7.2A') {
            for ($row = 7; $row <= $lastRow; $row++) {
                for ($col = 'B'; $col <= 'G'; $col++) {
                    $sheet->getStyle("{$col}{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
                }
            }
        } elseif ($form === '7.2B') {
            $numberColumns = ['G', 'H', 'I', 'J', 'K', 'L', 'O', 'P', 'Q', 'R', 'S', 'T'];
            for ($row = 8; $row <= $lastRow; $row++) {
                foreach ($numberColumns as $col) {
                    $sheet->getStyle("{$col}{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
                }
            }
        } elseif ($form === '7.2C') {
            $numberColumns = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'];
            for ($row = 8; $row <= $lastRow; $row++) {
                foreach ($numberColumns as $col) {
                    $sheet->getStyle("{$col}{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
                }
            }
        }
    }

    private function addMissingFormulas(Worksheet $sheet, string $form): void
    {
        $lastRow = $sheet->getHighestRow();

        if ($form === '7.2A') {
            $sheet->setCellValue('B10', '=B7+B8+B9');
            $sheet->setCellValue('C10', '=C7+C8+C9');
            $sheet->setCellValue('D10', '=D7+D8+D9');
            $sheet->setCellValue('E10', '=E7+E8+E9');
            $sheet->setCellValue('F10', '=F7+F8+F9');
            $sheet->setCellValue('G10', '=G7+G8+G9');

            $sheet->setCellValue('B19', '=B14+B15+B16+B17+B18');
            $sheet->setCellValue('C19', '=C14+C15+C16+C17+C18');
            $sheet->setCellValue('D19', '=D14+D15+D16+D17+D18');
            $sheet->setCellValue('E19', '=E14+E15+E16+E17+E18');
            $sheet->setCellValue('F19', '=F14+F15+F16+F17+F18');
            $sheet->setCellValue('G19', '=G14+G15+G16+G17+G18');

            $this->line('  Added SUM formulas for TOTAL ASSETS (row 10) and TOTAL LIABILITIES (row 19)');
        } elseif ($form === '7.2C') {
            $sumColumns = ['G', 'H', 'I', 'J', 'K', 'M', 'U', 'V', 'W', 'X'];
            foreach ($sumColumns as $col) {
                $sheet->setCellValue("{$col}30", "=SUM({$col}8:{$col}28)");
            }

            $this->line('  Added missing SUM formulas for columns G, H, I, J, K, M, U, V, W, X');
        }
    }
}
