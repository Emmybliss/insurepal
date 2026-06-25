<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PruneRecycleBin extends Command
{
    protected $signature = 'recycle-bin:prune';

    protected $description = 'Permanently delete records from the recycle bin that have exceeded the retention period';

    public function handle(): int
    {
        $retentionDays = config('recycle-bin.retention_days', 30);
        $models = config('recycle-bin.models', []);

        $this->info("Starting recycle bin prune (retention: {$retentionDays} days)...");

        $totalDeleted = 0;
        $results = [];

        foreach ($models as $type => $modelClass) {
            try {
                $cutoffDate = now()->subDays($retentionDays);

                $count = $modelClass::onlyTrashed()
                    ->where('deleted_at', '<=', $cutoffDate)
                    ->count();

                if ($count === 0) {
                    continue;
                }

                $deleted = 0;

                $modelClass::onlyTrashed()
                    ->where('deleted_at', '<=', $cutoffDate)
                    ->chunkById(100, function ($records) use (&$deleted) {
                        foreach ($records as $record) {
                            $record->forceDelete();
                            $deleted++;
                        }
                    });

                $results[$type] = $deleted;
                $totalDeleted += $deleted;

                $this->line("Deleted {$deleted} {$type} records");

            } catch (\Exception $e) {
                Log::error("Failed to prune {$type}: ".$e->getMessage());

                $this->error("Failed to prune {$type}: ".$e->getMessage());
            }
        }

        $this->info("Prune complete. Total records deleted: {$totalDeleted}");

        return Command::SUCCESS;
    }
}
