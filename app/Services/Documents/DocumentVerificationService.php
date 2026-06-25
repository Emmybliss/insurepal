<?php

namespace App\Services\Documents;

use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DocumentVerificationService
{
    public function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    public function generateDocumentHash(array $snapshot): string
    {
        return hash('sha256', json_encode($snapshot));
    }

    public function computeSnapshot(array $payload, array $extra = []): array
    {
        return array_merge([
            'document_number' => $payload['note_number']
                ?? $payload['invoice_number']
                ?? $payload['receipt_number']
                ?? $payload['slip_number']
                ?? '',
            'amount' => $payload['amount'] ?? $payload['total_amount'] ?? '',
            'total_amount' => $payload['total_amount'] ?? '',
            'issue_date' => $payload['issue_date'] ?? $payload['invoice_date'] ?? $payload['receipt_date'] ?? '',
            'customer_name' => $payload['customer_name'] ?? '',
            'currency' => $payload['currency'] ?? 'NGN',
        ], $extra);
    }

    public function generateBarcodeBase64(string $data): ?string
    {
        if ($data === '') {
            return null;
        }

        $barcode = new \Milon\Barcode\DNS1D;

        return 'data:image/png;base64,'.$barcode->getBarcodePNG($data, 'C128', 2, 50);
    }

    public function generateQrCodeBase64(string $data): ?string
    {
        if ($data === '') {
            return null;
        }

        $png = QrCode::format('png')
            ->size(120)
            ->margin(1)
            ->generate($data);

        return 'data:image/png;base64,'.base64_encode($png);
    }
}
