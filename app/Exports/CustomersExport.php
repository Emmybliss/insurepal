<?php

namespace App\Exports;

use App\Models\Customer;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CustomersExport
{
    public function exportAll(array $filters = []): string
    {
        $query = Customer::query()->forTenant(auth()->user()->tenant_id);

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        $customers = $query->latest()->get();

        return $this->generateFile($customers, 'customers_export_'.now()->format('Y_m_d_H_i_s').'.xlsx');
    }

    public function exportTemplate(): string
    {
        return $this->generateFile(collect(), 'customer_import_template.xlsx');
    }

    private function generateFile($customers, string $filename): string
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Customers');

        $headers = [
            'Type',
            'First Name',
            'Last Name',
            'Company Name',
            'Email',
            'Phone',
            'Date of Birth',
            'Gender',
            'Occupation',
            'Annual Income',
            'Address',
            'City',
            'State',
            'Country',
            'Status',
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col.'1', $header);
            $sheet->getStyle($col.'1')->getFont()->setBold(true);
            $sheet->getStyle($col.'1')->getFill()->setFillType(Fill::FILL_SOLID);
            $sheet->getStyle($col.'1')->getFill()->getStartColor()->setRGB('2E86AB');
            $sheet->getStyle($col.'1')->getFont()->getColor()->setRGB('FFFFFF');
            $sheet->getStyle($col.'1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $col++;
        }

        $row = 2;
        foreach ($customers as $customer) {
            $sheet->setCellValue('A'.$row, $customer->type);
            $sheet->setCellValue('B'.$row, $customer->first_name);
            $sheet->setCellValue('C'.$row, $customer->last_name);
            $sheet->setCellValue('D'.$row, $customer->company_name);
            $sheet->setCellValue('E'.$row, $customer->email);
            $sheet->setCellValue('F'.$row, $customer->phone);
            $sheet->setCellValue('G'.$row, $customer->date_of_birth?->format('Y-m-d'));
            $sheet->setCellValue('H'.$row, $customer->gender);
            $sheet->setCellValue('I'.$row, $customer->occupation);
            $sheet->setCellValue('J'.$row, $customer->annual_income);
            $sheet->setCellValue('K'.$row, $customer->address);
            $sheet->setCellValue('L'.$row, $customer->city);
            $sheet->setCellValue('M'.$row, $customer->state);
            $sheet->setCellValue('N'.$row, $customer->country);
            $sheet->setCellValue('O'.$row, $customer->is_active ? 'Active' : 'Inactive');
            $row++;
        }

        foreach (range('A', 'O') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filepath = storage_path('app/exports/'.$filename);
        if (! file_exists(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }
        $writer->save($filepath);

        return $filepath;
    }
}
