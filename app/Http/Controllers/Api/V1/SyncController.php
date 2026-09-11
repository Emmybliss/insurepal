<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Sync\SyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    public function __construct(public SyncService $syncService) {}

    /**
     * Handle bidirectional sync push & pull request.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|string|max:64',
            'device_name' => 'nullable|string|max:255',
            'platform' => 'nullable|string|max:32',
            'last_sync_cursor' => 'nullable|integer|min:0',
            'outbox_operations' => 'nullable|array',
            'outbox_operations.*.operation_id' => 'required|string|max:64',
            'outbox_operations.*.idempotency_key' => 'required|string|max:128',
            'outbox_operations.*.entity_type' => 'required|string|max:64',
            'outbox_operations.*.entity_id' => 'required|string|max:64',
            'outbox_operations.*.action' => 'required|string|max:32',
            'outbox_operations.*.payload' => 'required|array',
        ]);

        $result = $this->syncService->processSync($request->user(), $validated);

        return response()->json($result);
    }

    /**
     * Health status check endpoint for desktop application.
     */
    public function health(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status' => 'healthy',
            'tenant_id' => $user->tenant_id,
            'tenant_name' => $user->tenant?->name,
            'user_id' => $user->id,
            'server_time' => now()->toIso8601String(),
            'version' => '1.0.0-desktop-ready',
        ]);
    }
}
