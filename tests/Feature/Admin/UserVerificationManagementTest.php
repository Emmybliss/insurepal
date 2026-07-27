<?php

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use App\Notifications\AccountApprovedNotification;
use App\Notifications\AccountRejectedNotification;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    // Seed essential super_admin role
    Role::firstOrCreate(['name' => 'super_admin'], ['label' => 'Super Admin', 'description' => 'Super admin role']);
});

test('super admin can manually approve an unverified user', function () {
    Notification::fake();

    $superAdmin = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $superAdmin->assignRole('super_admin');

    $unverifiedUser = User::factory()->unverified()->create([
        'status' => 'pending_verification',
    ]);

    $response = $this->actingAs($superAdmin)
        ->post(route('admin.users.force-verify-email', $unverifiedUser->id));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $freshUser = $unverifiedUser->fresh();
    expect($freshUser->hasVerifiedEmail())->toBeTrue();
    expect($freshUser->status)->toBe('active');
    expect($freshUser->approval_method)->toBe('manual');
    expect($freshUser->approved_by)->toBe($superAdmin->id);

    // Verify audit log entry created
    $auditLog = AuditLog::where('subject_type', User::class)
        ->where('subject_id', $unverifiedUser->id)
        ->where('action', 'manual_approval')
        ->first();

    expect($auditLog)->not->toBeNull();
    expect($auditLog->user_id)->toBe($superAdmin->id);

    // Verify notification sent
    Notification::assertSentTo($unverifiedUser, AccountApprovedNotification::class);
});

test('super admin can reject an unverified user', function () {
    Notification::fake();

    $superAdmin = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $superAdmin->assignRole('super_admin');

    $unverifiedUser = User::factory()->unverified()->create([
        'status' => 'pending_verification',
    ]);

    $response = $this->actingAs($superAdmin)
        ->post(route('admin.users.reject', $unverifiedUser->id), [
            'reason' => 'Invalid tenant details',
        ]);

    $response->assertRedirect();

    $freshUser = $unverifiedUser->fresh();
    expect($freshUser->status)->toBe('disabled');
    expect($freshUser->is_active)->toBeFalse();

    Notification::assertSentTo($unverifiedUser, AccountRejectedNotification::class);
});

test('super admin can revoke verification for a user', function () {
    $superAdmin = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $superAdmin->assignRole('super_admin');

    $verifiedUser = User::factory()->create([
        'email_verified_at' => now(),
        'status' => 'active',
        'approval_method' => 'manual',
        'approved_by' => $superAdmin->id,
        'approved_at' => now(),
    ]);

    $response = $this->actingAs($superAdmin)
        ->post(route('admin.users.revoke-verification', $verifiedUser->id));

    $response->assertRedirect();

    $freshUser = $verifiedUser->fresh();
    expect($freshUser->hasVerifiedEmail())->toBeFalse();
    expect($freshUser->status)->toBe('pending_verification');
    expect($freshUser->approval_method)->toBeNull();
    expect($freshUser->approved_by)->toBeNull();
});

test('super admin can perform bulk manual approval', function () {
    Notification::fake();

    $superAdmin = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $superAdmin->assignRole('super_admin');

    $user1 = User::factory()->unverified()->create();
    $user2 = User::factory()->unverified()->create();

    $response = $this->actingAs($superAdmin)
        ->post(route('admin.users.bulk-action'), [
            'action' => 'verify_email',
            'user_ids' => [$user1->id, $user2->id],
        ]);

    $response->assertRedirect();

    expect($user1->fresh()->hasVerifiedEmail())->toBeTrue();
    expect($user2->fresh()->hasVerifiedEmail())->toBeTrue();
    expect($user1->fresh()->approval_method)->toBe('manual');
    expect($user2->fresh()->approval_method)->toBe('manual');
});

test('non-super admin user cannot perform manual approval', function () {
    $regularUser = User::factory()->create();
    $targetUser = User::factory()->unverified()->create();

    $response = $this->actingAs($regularUser)
        ->post(route('admin.users.force-verify-email', $targetUser->id));

    $response->assertStatus(403);
});
