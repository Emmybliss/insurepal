<?php

namespace App\Services;

use App\Models\DocumentTemplate;
use App\Models\Policy;
use App\Models\PolicyCertificate;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CertificateGenerationService
{
    public function __construct(
        protected CertificateDesignEngine $designEngine
    ) {}

    public function resolveTemplate(string $templateKey): ?array
    {
        return $this->designEngine->resolveTemplate($templateKey);
    }

    public function getAvailableTemplates(): array
    {
        return $this->designEngine->getAvailableTemplates();
    }

    public function generateQrBarcodeData(Policy $policy, string $certificateNumber): array
    {
        return $this->designEngine->generateQrBarcodeData($policy, $certificateNumber);
    }

    public function prepareCertificateData(Policy $policy, string $templateKey): array
    {
        return $this->designEngine->prepareCertificateData($policy, $templateKey);
    }

    public function generate(Policy $policy, User $user, array $data, UploadedFile $file, string $templateKey): PolicyCertificate
    {
        $type = $data['type'] ?? 'policy_certificate';

        $fileName = 'certificate-'.uniqid().'.'.$file->getClientOriginalExtension();
        $pdfPath = $file->storeAs("certificates/{$policy->tenant_id}/pdfs", $fileName, 'public');

        $certificateNumber = PolicyCertificate::generateCertificateNumber(
            $policy->tenant_id,
            strtoupper(substr($type, 0, 4))
        );

        $certificate = PolicyCertificate::create([
            'tenant_id' => $policy->tenant_id,
            'policy_id' => $policy->id,
            'certificate_number' => $certificateNumber,
            'type' => $type,
            'status' => PolicyCertificate::STATUS_GENERATED,
            'file_path' => $pdfPath,
            'file_name' => $fileName,
            'file_size' => $file->getSize(),
            'file_hash' => hash_file('sha256', $file->getPathname()),
            'generated_at' => now(),
            'generated_by' => $user->id,
            'generation_metadata' => [
                'template_key' => $templateKey,
                'generation_options' => $data['options'] ?? [],
                'generated_at' => now()->toISOString(),
                'generated_by' => $user->id,
            ],
            'certificate_data' => $this->designEngine->prepareCertificateData($policy, $templateKey),
        ]);

        $certificate->addToAuditTrail(
            'generated',
            'Certificate generated',
            'Template: '.$templateKey
        );

        return $certificate;
    }

    public function regenerate(PolicyCertificate $certificate, User $user, array $data, UploadedFile $file, string $templateKey): PolicyCertificate
    {
        if ($certificate->file_path && Storage::disk('public')->exists($certificate->file_path)) {
            Storage::disk('public')->delete($certificate->file_path);
        }

        $fileName = 'certificate-'.uniqid().'.'.$file->getClientOriginalExtension();
        $pdfPath = $file->storeAs("certificates/{$certificate->tenant_id}/pdfs", $fileName, 'public');

        $type = $data['type'] ?? 'policy_certificate';

        $certificate->update([
            'type' => $type,
            'file_path' => $pdfPath,
            'file_name' => $fileName,
            'file_size' => $file->getSize(),
            'file_hash' => hash_file('sha256', $file->getPathname()),
            'generation_metadata' => [
                'template_key' => $templateKey,
                'generation_options' => $data['options'] ?? [],
                'regenerated_at' => now()->toISOString(),
                'regenerated_by' => $user->id,
            ],
        ]);

        $certificate->addToAuditTrail(
            'regenerated',
            'Certificate regenerated with new PDF',
            'Template: '.$templateKey
        );

        return $certificate->fresh();
    }

    public function generateMultipleCertificates(Policy $policy, User $user, array $templateIds, array $options): array
    {
        $certificates = [];

        foreach ($templateIds as $templateId) {
            $template = DocumentTemplate::findOrFail($templateId);

            $certificate = PolicyCertificate::create([
                'tenant_id' => $policy->tenant_id,
                'policy_id' => $policy->id,
                'certificate_number' => PolicyCertificate::generateCertificateNumber(
                    $policy->tenant_id,
                    'CERT'
                ),
                'type' => $template->certificate_type ?? 'policy_certificate',
                'status' => PolicyCertificate::STATUS_GENERATED,
                'generated_at' => now(),
                'generated_by' => $user->id,
                'generation_metadata' => [
                    'template_id' => $template->id,
                    'template_name' => $template->name,
                    'generation_options' => $options,
                    'generated_at' => now()->toISOString(),
                    'generated_by' => $user->id,
                ],
                'certificate_data' => $this->designEngine->prepareCertificateData(
                    $policy,
                    $template->html_template_key ?? 'certificate.classic'
                ),
            ]);

            $certificate->addToAuditTrail(
                'generated',
                'Certificate generated via bulk generation',
                'Template: '.($template->name ?? $templateId)
            );

            $certificates[] = $certificate;
        }

        return $certificates;
    }
}
