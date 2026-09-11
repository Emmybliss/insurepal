<?php

namespace App\Services\Sync;

use App\Models\Customer;
use App\Models\Quote;
use App\Models\SyncChange;
use App\Models\SyncDevice;
use App\Models\SyncOperation;
use App\Models\User;
use App\Observers\SyncObserver;
use App\Services\PolicyIssuanceService;
use App\Services\QuoteService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncService
{
    public function processSync(User $user, array $data): array
    {
        $tenantId = $user->tenant_id;
        $deviceId = $data['device_id'] ?? 'unknown';
        $deviceName = $data['device_name'] ?? 'Desktop App';
        $platform = $data['platform'] ?? 'desktop';
        $lastSyncCursor = (int) ($data['last_sync_cursor'] ?? 0);
        $outboxOperations = $data['outbox_operations'] ?? [];

        // 1. Register / update device info
        $device = SyncDevice::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'device_id' => $deviceId,
            ],
            [
                'user_id' => $user->id,
                'device_name' => $deviceName,
                'platform' => $platform,
                'last_synced_at' => now(),
            ]
        );

        $acceptedOperations = [];
        $conflicts = [];
        $failedOperations = [];

        // 2. Process outbox mutations atomically
        if (! empty($outboxOperations)) {
            SyncObserver::$isSyncing = true;
            try {
                DB::transaction(function () use (
                    $tenantId,
                    $deviceId,
                    $outboxOperations,
                    &$acceptedOperations,
                    &$conflicts,
                    &$failedOperations
                ) {
                    foreach ($outboxOperations as $op) {
                        $operationId = $op['operation_id'] ?? null;
                        $idempotencyKey = $op['idempotency_key'] ?? null;
                        $entityType = strtolower($op['entity_type'] ?? '');
                        $entityId = $op['entity_id'] ?? null;
                        $action = $op['action'] ?? 'create';
                        $payload = $op['payload'] ?? [];

                        if (! $operationId || ! $idempotencyKey) {
                            continue;
                        }

                        // Idempotency check
                        $existingOp = SyncOperation::where('idempotency_key', $idempotencyKey)->first();
                        if ($existingOp) {
                            $acceptedOperations[] = [
                                'operation_id' => $operationId,
                                'idempotency_key' => $idempotencyKey,
                                'entity_type' => $entityType,
                                'client_id' => $entityId,
                                'status' => 'already_processed',
                                'response' => $existingOp->response_payload,
                            ];

                            continue;
                        }

                        try {
                            $result = $this->executeOperation($tenantId, $entityType, $action, $entityId, $payload);

                            SyncOperation::create([
                                'tenant_id' => $tenantId,
                                'operation_id' => $operationId,
                                'idempotency_key' => $idempotencyKey,
                                'device_id' => $deviceId,
                                'entity_type' => $entityType,
                                'entity_id' => (string) ($result['server_id'] ?? $entityId),
                                'action' => $action,
                                'status' => 'completed',
                                'response_payload' => $result,
                            ]);

                            $acceptedOperations[] = array_merge([
                                'operation_id' => $operationId,
                                'idempotency_key' => $idempotencyKey,
                                'entity_type' => $entityType,
                                'client_id' => $entityId,
                                'status' => 'synced',
                            ], $result);
                        } catch (\Throwable $e) {
                            Log::error("Sync operation failed: {$operationId}", [
                                'error' => $e->getMessage(),
                                'op' => $op,
                            ]);

                            $failedOperations[] = [
                                'operation_id' => $operationId,
                                'idempotency_key' => $idempotencyKey,
                                'entity_type' => $entityType,
                                'client_id' => $entityId,
                                'error' => $e->getMessage(),
                            ];
                        }
                    }
                });
            } finally {
                SyncObserver::$isSyncing = false;
            }
        }

        // 3. Pull server changes after last_sync_cursor
        $changesQuery = SyncChange::where('tenant_id', $tenantId)
            ->where('cursor', '>', $lastSyncCursor)
            ->orderBy('cursor', 'asc')
            ->limit(500);

        $changes = $changesQuery->get();
        $nextCursor = $changes->max('cursor') ?? $lastSyncCursor;

        // Update device cursor
        $device->update(['last_sync_cursor' => $nextCursor]);

        return [
            'status' => 'success',
            'device_id' => $deviceId,
            'last_sync_cursor' => $lastSyncCursor,
            'next_cursor' => $nextCursor,
            'accepted_operations' => $acceptedOperations,
            'conflicts' => $conflicts,
            'failed_operations' => $failedOperations,
            'incoming_changes' => $changes->map(fn ($c) => [
                'cursor' => $c->cursor,
                'entity_type' => $c->entity_type,
                'entity_id' => $c->entity_id,
                'client_uuid' => $c->client_uuid,
                'action' => $c->action,
                'data' => $c->payload,
                'timestamp' => $c->created_at?->toIso8601String(),
            ])->values()->toArray(),
        ];
    }

    protected function executeOperation(int $tenantId, string $entityType, string $action, string $entityId, array $payload): array
    {
        return match ($entityType) {
            'customer' => $this->handleCustomerOperation($tenantId, $action, $entityId, $payload),
            'quote' => $this->handleQuoteOperation($tenantId, $action, $entityId, $payload),
            'policy' => $this->handlePolicyOperation($tenantId, $action, $entityId, $payload),
            default => throw new \InvalidArgumentException("Unsupported entity type for sync: {$entityType}"),
        };
    }

    protected function handleCustomerOperation(int $tenantId, string $action, string $entityId, array $payload): array
    {
        $payload['tenant_id'] = $tenantId;

        if ($action === 'create') {
            $customer = Customer::create($payload);

            return [
                'server_id' => $customer->id,
                'client_id' => $entityId,
                'entity' => $customer->toArray(),
            ];
        }

        if ($action === 'update') {
            $customer = Customer::where('tenant_id', $tenantId)
                ->where(function ($q) use ($entityId) {
                    $q->where('id', $entityId)->orWhere('user_id', $entityId);
                })->firstOrFail();

            $customer->update($payload);

            return [
                'server_id' => $customer->id,
                'client_id' => $entityId,
                'entity' => $customer->fresh()->toArray(),
            ];
        }

        if ($action === 'delete') {
            $customer = Customer::where('tenant_id', $tenantId)->where('id', $entityId)->first();
            if ($customer) {
                $customer->delete();
            }

            return ['server_id' => $entityId, 'status' => 'deleted'];
        }

        throw new \InvalidArgumentException("Unsupported customer action: {$action}");
    }

    protected function handleQuoteOperation(int $tenantId, string $action, string $entityId, array $payload): array
    {
        $payload['tenant_id'] = $tenantId;

        if ($action === 'create') {
            $quoteService = app(QuoteService::class);
            $quote = $quoteService->createQuote($payload);

            return [
                'server_id' => $quote->id,
                'client_id' => $entityId,
                'quote_number' => $quote->quote_number,
                'entity' => $quote->toArray(),
            ];
        }

        if ($action === 'update') {
            $quoteService = app(QuoteService::class);
            $quote = Quote::where('tenant_id', $tenantId)->where('id', $entityId)->firstOrFail();
            $updated = $quoteService->updateQuote($quote, $payload);

            return [
                'server_id' => $updated->id,
                'client_id' => $entityId,
                'entity' => $updated->toArray(),
            ];
        }

        throw new \InvalidArgumentException("Unsupported quote action: {$action}");
    }

    protected function handlePolicyOperation(int $tenantId, string $action, string $entityId, array $payload): array
    {
        $payload['tenant_id'] = $tenantId;

        if ($action === 'create') {
            $issuanceService = app(PolicyIssuanceService::class);
            $policy = $issuanceService->createDraftPolicy($payload);

            return [
                'server_id' => $policy->id,
                'client_id' => $entityId,
                'policy_number' => $policy->policy_number_display,
                'entity' => $policy->toArray(),
            ];
        }

        throw new \InvalidArgumentException("Unsupported policy action: {$action}");
    }
}
