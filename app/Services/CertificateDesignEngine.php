<?php

namespace App\Services;

use App\Models\Policy;
use App\Models\PolicyCertificate;

class CertificateDesignEngine
{
    public function resolveTemplate(string $templateKey): ?array
    {
        $registry = config('document-templates.templates', []);

        return $registry[$templateKey] ?? null;
    }

    public function getAvailableTemplates(): array
    {
        $registry = config('document-templates.templates', []);
        $certTemplates = array_filter($registry, fn ($t) => ($t['type'] ?? '') === 'certificate');

        return array_map(fn ($key, $template) => [
            'key' => $key,
            'name' => $template['name'] ?? $key,
            'type' => $template['type'] ?? 'certificate',
            'category' => $template['category'] ?? 'standard',
            'description' => $template['description'] ?? '',
        ], array_keys($certTemplates), $certTemplates);
    }

    public function generateQrBarcodeData(Policy $policy, string $certificateNumber): array
    {
        $number = $policy->policy_number_display;
        $verifyUrl = route('certificates.verify', ['certificateNumber' => $certificateNumber]);

        return [
            'qr_code_policy' => url('/media/qrcode/'.urlencode($verifyUrl)),
            'qr_code_certificate' => url('/media/qrcode/'.urlencode($verifyUrl)),
            'barcode_policy' => url('/media/barcode/'.urlencode($number)),
            'barcode_certificate' => url('/media/barcode/'.urlencode($certificateNumber)),
        ];
    }

    public function prepareCertificateData(Policy $policy, string $templateKey): array
    {
        $customer = $policy->customer;
        $product = $policy->policyProduct;
        $certificateNumber = PolicyCertificate::generateCertificateNumber(
            $policy->tenant_id,
            strtoupper(substr('policy_certificate', 0, 4))
        );

        $template = $this->resolveTemplate($templateKey) ?? [];
        $number = $policy->policy_number_display;

        return [
            'certificate_number' => $certificateNumber,
            'generation_date' => now()->format('d/m/Y'),
            'generation_time' => now()->format('H:i:s'),
            'policy_number' => $number,
            'policy_status' => $policy->status,
            'effective_date' => $policy->effective_date,
            'expiry_date' => $policy->expiry_date,
            'premium_amount' => $policy->premium_amount,
            'total_amount' => $policy->total_amount,
            'payment_frequency' => $policy->payment_frequency,
            'coverage_details' => $policy->coverage_details,
            'form_data' => $policy->form_data,
            'customer_name' => $this->getCustomerName($customer),
            'customer_type' => $customer->type,
            'customer_email' => $customer->email,
            'customer_phone' => $customer->phone,
            'customer_address' => $this->getCustomerAddress($customer),
            'product_name' => $product->name,
            'product_description' => $product->description,
            'product_category' => $product->category,
            'company_name' => $policy->tenant->name,
            'company_address' => $policy->tenant->address,
            'company_phone' => $policy->tenant->phone,
            'company_email' => $policy->tenant->email,
            'qr_code_policy' => url('/media/qrcode/'.urlencode(route('certificates.verify', ['certificateNumber' => $certificateNumber]))),
            'qr_code_certificate' => url('/media/qrcode/'.urlencode(route('certificates.verify', ['certificateNumber' => $certificateNumber]))),
            'barcode_policy' => url('/media/barcode/'.urlencode($number)),
            'barcode_certificate' => url('/media/barcode/'.urlencode($certificateNumber)),
            'template_name' => $template['name'] ?? $templateKey,
            'template_type' => $template['type'] ?? 'certificate',
        ];
    }

    public function getCustomerName($customer): string
    {
        if ($customer->type === 'corporate') {
            return $customer->company_name ?: ($customer->first_name.' '.$customer->last_name);
        }

        return $customer->first_name.' '.$customer->last_name;
    }

    public function getCustomerAddress($customer): string
    {
        $address = [];

        if ($customer->address) {
            $address[] = $customer->address;
        }
        if ($customer->city) {
            $address[] = $customer->city;
        }
        if ($customer->state) {
            $address[] = $customer->state;
        }
        if ($customer->country) {
            $address[] = $customer->country;
        }

        return implode(', ', $address);
    }
}
