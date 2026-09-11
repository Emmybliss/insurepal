<?php

namespace App\Observers;

use App\Models\SyncChange;
use Illuminate\Database\Eloquent\Model;

class SyncObserver
{
    /**
     * Flag to temporarily disable sync tracking during incoming sync push processing.
     */
    public static bool $isSyncing = false;

    public function created(Model $model): void
    {
        $this->recordChange($model, 'create');
    }

    public function updated(Model $model): void
    {
        $this->recordChange($model, 'update');
    }

    public function deleted(Model $model): void
    {
        $this->recordChange($model, 'delete');
    }

    protected function recordChange(Model $model, string $action): void
    {
        if (self::$isSyncing) {
            return;
        }

        $tenantId = $model->tenant_id ?? auth()->user()?->tenant_id;
        if (! $tenantId) {
            return;
        }

        $entityType = strtolower(class_basename($model));
        $clientUuid = $model->client_uuid ?? null;

        SyncChange::create([
            'tenant_id' => $tenantId,
            'entity_type' => $entityType,
            'entity_id' => $model->id,
            'client_uuid' => $clientUuid,
            'action' => $action,
            'payload' => $action === 'delete' ? ['id' => $model->id] : $model->toArray(),
            'created_at' => now(),
        ]);
    }
}
