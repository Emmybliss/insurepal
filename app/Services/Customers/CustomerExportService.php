<?php

namespace App\Services\Customers;

use App\Models\Customer;
use App\Models\User;
use App\Services\Pdf\PdfService;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CustomerExportService
{
    public function __construct(
        protected PdfService $pdfService
    ) {}

    public function downloadPdf(Customer $customer, User $user)
    {
        $customer->load(['user', 'kyc', 'policies.policyProduct', 'quotes.insuranceProduct']);

        $pdfContent = $this->pdfService->renderView('pdfs.customer', [
            'customer' => $customer,
            'company' => $user->tenant,
        ]);

        $slug = Str::slug($customer->display_name);
        $fileName = ($slug ?: 'customer-'.$customer->id).'.pdf';

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
        ]);
    }

    public function downloadExcel(Customer $customer, User $user)
    {
        $customer->load(['user', 'kyc', 'policies.policyProduct', 'quotes.insuranceProduct']);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Customer Details');

        $sheet->fromArray(['Field', 'Value'], null, 'A1');
        $sheet->fromArray([
            ['Name', $customer->display_name],
            ['Email', $customer->email],
            ['Phone', $customer->phone],
            ['Type', $customer->type],
            ['Company Name', $customer->company_name],
            ['Status', $customer->is_active ? 'Active' : 'Inactive'],
            ['Date of Birth', $customer->date_of_birth],
            ['Address', $customer->address],
            ['City', $customer->city],
            ['State', $customer->state],
            ['Country', $customer->country],
            ['Created At', optional($customer->created_at)->format('Y-m-d H:i:s')],
        ], null, 'A2');

        if ($customer->policies->count() > 0) {
            $policySheet = $spreadsheet->createSheet();
            $policySheet->setTitle('Policies');
            $policySheet->fromArray(['Policy Number', 'Type', 'Product', 'Premium', 'Status', 'Start Date', 'Expiry Date'], null, 'A1');
            $policySheet->fromArray($customer->policies->map(fn ($p) => [
                $p->policy_number,
                $p->type,
                optional($p->policyProduct)->name ?? 'N/A',
                $p->premium_amount,
                $p->status,
                optional($p->start_date)->format('Y-m-d') ?? 'N/A',
                optional($p->expiry_date)->format('Y-m-d') ?? 'N/A',
            ])->toArray(), null, 'A2');
            $policySheet->getStyle('A1:G1')->getFont()->setBold(true);
            foreach (range('A', 'G') as $col) {
                $policySheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        if ($customer->quotes->count() > 0) {
            $quoteSheet = $spreadsheet->createSheet();
            $quoteSheet->setTitle('Quotes');
            $quoteSheet->fromArray(['Quote Number', 'Product', 'Premium', 'Status', 'Valid Until', 'Created At'], null, 'A1');
            $quoteSheet->fromArray($customer->quotes->map(fn ($q) => [
                $q->quote_number,
                optional($q->insuranceProduct)->name ?? 'N/A',
                $q->premium_amount,
                $q->status,
                optional($q->valid_until)->format('Y-m-d') ?? 'N/A',
                optional($q->created_at)->format('Y-m-d'),
            ])->toArray(), null, 'A2');
            $quoteSheet->getStyle('A1:F1')->getFont()->setBold(true);
            foreach (range('A', 'F') as $col) {
                $quoteSheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        $spreadsheet->setActiveSheetIndex(0);
        $sheet->getStyle('A1:B1')->getFont()->setBold(true);
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);

        $writer = new Xlsx($spreadsheet);
        $slug = Str::slug($customer->display_name);
        $fileName = ($slug ?: 'customer-'.$customer->id).'.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'excel');
        $writer->save($tempFile);

        if (! file_exists($tempFile)) {
            abort(404);
        }

        $content = file_get_contents($tempFile);
        @unlink($tempFile);

        $mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        return response($content, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            'Content-Length' => strlen($content),
        ]);
    }
}
