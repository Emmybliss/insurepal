<?php

namespace App\Imports;

use App\Models\Customer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class CustomersImport
{
    public function import(string $filepath): array
    {
        $tenantId = Auth::user()->tenant_id;
        $spreadsheet = IOFactory::load($filepath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        if (count($rows) < 2) {
            return [
                'created' => 0,
                'skipped' => 0,
                'errors' => ['The file is empty or has no data rows.'],
            ];
        }

        $created = 0;
        $skipped = 0;
        $errors = [];

        $existingEmails = Customer::forTenant($tenantId)
            ->whereNotNull('email')
            ->pluck('email')
            ->map(fn ($e) => strtolower(trim($e)))
            ->toArray();

        foreach ($rows as $index => $row) {
            if ($index === 0) {
                continue;
            }

            $rowNum = $index + 1;

            $type = trim((string) ($row[0] ?? ''));
            $firstName = trim((string) ($row[1] ?? ''));
            $lastName = trim((string) ($row[2] ?? ''));
            $companyName = trim((string) ($row[3] ?? ''));
            $email = trim((string) ($row[4] ?? ''));
            $phone = trim((string) ($row[5] ?? ''));
            $dateOfBirth = trim((string) ($row[6] ?? ''));
            $gender = trim((string) ($row[7] ?? ''));
            $occupation = trim((string) ($row[8] ?? ''));
            $annualIncome = trim((string) ($row[9] ?? ''));
            $address = trim((string) ($row[10] ?? ''));
            $city = trim((string) ($row[11] ?? ''));
            $state = trim((string) ($row[12] ?? ''));
            $country = trim((string) ($row[13] ?? ''));
            $status = trim((string) ($row[14] ?? ''));

            if (empty($type) || ! in_array($type, ['individual', 'corporate'])) {
                $errors[] = "Row {$rowNum}: Invalid or missing type '{$type}'. Must be 'individual' or 'corporate'.";

                continue;
            }

            if ($type === 'individual' && (empty($firstName) || empty($lastName))) {
                $errors[] = "Row {$rowNum}: First name and last name are required for individual customers.";

                continue;
            }

            if ($type === 'corporate' && empty($companyName)) {
                $errors[] = "Row {$rowNum}: Company name is required for corporate customers.";

                continue;
            }

            if (! empty($email)) {
                $emailLower = strtolower($email);
                if (in_array($emailLower, $existingEmails)) {
                    $skipped++;

                    continue;
                }
            }

            try {
                DB::beginTransaction();

                $customer = Customer::create([
                    'tenant_id' => $tenantId,
                    'type' => $type,
                    'first_name' => $firstName ?: null,
                    'last_name' => $lastName ?: null,
                    'company_name' => $companyName ?: null,
                    'email' => $email ?: null,
                    'phone' => $phone ?: null,
                    'date_of_birth' => $dateOfBirth ?: null,
                    'gender' => $gender ?: null,
                    'occupation' => $occupation ?: null,
                    'annual_income' => $annualIncome ?: null,
                    'address' => $address ?: null,
                    'city' => $city ?: null,
                    'state' => $state ?: null,
                    'country' => $country ?: null,
                    'is_active' => ! in_array(strtolower($status), ['inactive', '0', 'no']),
                ]);

                if (! empty($email)) {
                    $existingEmails[] = strtolower($email);
                }

                DB::commit();
                $created++;
            } catch (\Exception $e) {
                DB::rollBack();
                $errors[] = "Row {$rowNum}: Failed to create customer - {$e->getMessage()}";
            }
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }
}
