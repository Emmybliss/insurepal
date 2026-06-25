<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// User-specific personal notifications (tenant-scoped)
Broadcast::channel('tenant.{tenantId}.notifications.{userId}', function ($user, $tenantId, $userId) {
    return (int) $user->id === (int) $userId
        && (int) $user->tenant_id === (int) $tenantId;
});

// Tenant-wide announcements (private, authorized)
Broadcast::channel('tenant.{tenantId}.announcements', function ($user, $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});

// Legacy - keep for backward compatibility until frontend updated
Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Legacy - keep for backward compatibility
Broadcast::channel('tenant.{tenantId}', function ($user, $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});

// Private message channel
Broadcast::channel('messages.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Claim channel for authorized users
Broadcast::channel('claims.{claimId}', function ($user, $claimId) {
    $claim = \App\Models\Claim::find($claimId);

    return $claim && $user->tenant_id === $claim->tenant_id;
});

// Unified Communication Thread channel
Broadcast::channel('threads.{threadId}', function ($user, $threadId) {
    $thread = \App\Models\CommunicationThread::find($threadId);

    return $thread
        && (int) $user->tenant_id === (int) $thread->tenant_id
        && $thread->participants()->where('user_id', $user->id)->whereNull('deleted_at')->exists();
});

// Keep existing user channel for backward compatibility
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Online status presence channel — any authenticated user can join
Broadcast::channel('presence.online-status', function (User $user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'avatar_url' => $user->avatar_url,
        'tenant_id' => $user->tenant_id,
        'role' => $user->getPrimaryRoleName(),
    ];
});
