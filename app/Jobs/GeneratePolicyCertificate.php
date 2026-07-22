<?php

namespace App\Jobs;

use App\Events\PolicyIssued;
use App\Services\CertificateGenerationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class GeneratePolicyCertificate implements ShouldQueue
{
    use InteractsWithQueue, Queueable;

    public function __construct() {}

    public function handle(PolicyIssued $event): void
    {
        try {
            $certificateService = app(CertificateGenerationService::class);
            $certificateData = $certificateService->prepareCertificateData(
                $event->policy,
                'certificate.classic'
            );

            Log::info('Policy certificate generation queued', [
                'policy_id' => $event->policy->id,
                'policy_number' => $event->policy->policy_number,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate policy certificate', [
                'policy_id' => $event->policy->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
