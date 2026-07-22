<?php

namespace App\Console\Commands;

use App\Models\NaicomReportRun;
use App\Models\Tenant;
use App\Services\Naicom\NaicomReportService;
use Illuminate\Console\Command;

class GenerateNaicomReportCommand extends Command
{
    protected $signature = 'naicom:generate-report
                            {--tenant= : The tenant ID to generate for (optional, defaults to all active broker tenants)}
                            {--year= : The reporting year (defaults to current year)}
                            {--half= : The reporting half-year H1 or H2 (defaults to current half)}';

    protected $description = 'Automatically generate NAICOM Form 7.2 report runs for active broker tenants';

    public function handle(NaicomReportService $reportService): int
    {
        $tenantId = $this->option('tenant');
        $year = (int) ($this->option('year') ?? now()->year);
        $half = strtoupper($this->option('half') ?? (now()->month <= 6 ? 'H1' : 'H2'));

        if (! in_array($half, ['H1', 'H2'])) {
            $this->error("Invalid reporting half '{$half}'. Must be H1 or H2.");

            return Command::FAILURE;
        }

        $query = Tenant::query();
        if ($tenantId) {
            $query->where('id', $tenantId);
        }

        $tenants = $query->get();

        if ($tenants->isEmpty()) {
            $this->warn('No matching tenants found.');

            return Command::SUCCESS;
        }

        $this->info("Generating NAICOM Form 7.2 reports for Year {$year}, Half {$half} across {$tenants->count()} tenant(s)...");

        foreach ($tenants as $tenant) {
            $this->line("Processing Tenant ID: {$tenant->id} ({$tenant->name})...");

            try {
                $run = NaicomReportRun::create([
                    'tenant_id' => $tenant->id,
                    'reporting_year' => $year,
                    'reporting_half' => $half,
                    'generated_by' => null,
                ]);

                $reportService->generate($run);

                $this->info("Successfully generated report run ID {$run->id} for Tenant ID {$tenant->id}.");
            } catch (\Throwable $e) {
                $this->error("Failed generating report for Tenant ID {$tenant->id}: {$e->getMessage()}");
            }
        }

        $this->info('NAICOM report generation complete.');

        return Command::SUCCESS;
    }
}
