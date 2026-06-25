<?php

namespace App\Console\Commands;

use App\Models\InsuranceCompanyBranch;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateInsuranceCompanyBranches extends Command
{
    protected $signature = 'insurance:migrate-branches';

    protected $description = 'Migrate existing branch text from insurance_company_tenant pivot into InsuranceCompanyBranch records';

    public function handle(): void
    {
        $pivotRows = DB::table('insurance_company_tenant')
            ->whereNotNull('branch')
            ->where('branch', '!=', '')
            ->get();

        if ($pivotRows->isEmpty()) {
            $this->info('No pivot rows with branch text found.');

            return;
        }

        $bar = $this->output->createProgressBar($pivotRows->count());
        $bar->start();

        $created = 0;
        $updated = 0;

        foreach ($pivotRows as $row) {
            $branch = InsuranceCompanyBranch::firstOrCreate([
                'insurance_company_id' => $row->insurance_company_id,
                'name' => $row->branch,
            ]);

            DB::table('insurance_company_tenant')
                ->where('id', $row->id)
                ->update(['insurance_company_branch_id' => $branch->id]);

            if ($branch->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }

            $bar->advance();
        }

        $bar->finish();

        $this->newLine();
        $this->info("Done! Created {$created} new branches, linked {$updated} existing branches.");
    }
}
