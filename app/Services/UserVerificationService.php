<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\AccountApprovedNotification;
use App\Notifications\AccountRejectedNotification;
use App\Notifications\EmailVerifiedNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserVerificationService
{
    /**
     * Send initial email verification notification to user upon registration or creation.
     */
    public function sendVerificationNotification(User $user): void
    {
        if ($user->hasVerifiedEmail()) {
            return;
        }

        $user->sendEmailVerificationNotification();

        $user->update([
            'last_verification_sent_at' => now(),
            'status' => 'pending_verification',
        ]);

        $user->logActivity(
            action: 'verification_email_sent',
            description: 'Verification email sent to user',
            metadata: [
                'email' => $user->email,
                'sent_at' => now()->toIso8601String(),
            ],
            user: $user
        );
    }

    /**
     * Resend verification notification to user.
     */
    public function resendVerificationNotification(User $user, ?User $triggeredBy = null): void
    {
        if ($user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => 'User email is already verified.',
            ]);
        }

        $user->sendEmailVerificationNotification();

        $user->update([
            'last_verification_sent_at' => now(),
        ]);

        $actor = $triggeredBy ?? $user;

        $user->logActivity(
            action: 'verification_email_resent',
            description: 'Verification email resent to user',
            metadata: [
                'email' => $user->email,
                'triggered_by' => $actor->id,
                'resent_at' => now()->toIso8601String(),
            ],
            user: $actor
        );
    }

    /**
     * Verify email address via user clicking signed verification link.
     */
    public function verifyEmailViaLink(User $user): bool
    {
        if ($user->hasVerifiedEmail()) {
            return false;
        }

        DB::transaction(function () use ($user) {
            $user->forceFill([
                'email_verified_at' => now(),
                'status' => 'active',
                'approval_method' => 'email',
                'approved_at' => now(),
                'is_active' => true,
            ])->save();

            event(new Verified($user));

            $user->logActivity(
                action: 'email_verified',
                description: 'User email address verified via verification link',
                metadata: [
                    'email' => $user->email,
                    'verified_at' => now()->toIso8601String(),
                    'method' => 'email',
                ],
                user: $user
            );
        });

        try {
            $user->notify(new EmailVerifiedNotification);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to send EmailVerifiedNotification to user {$user->id}: ".$e->getMessage());
        }

        return true;
    }

    /**
     * Manually approve and verify user by Super Admin.
     */
    public function approveManually(User $user, User $approver): bool
    {
        if ($user->hasVerifiedEmail() && $user->status === 'active' && $user->is_active) {
            throw ValidationException::withMessages([
                'user' => 'User is already active and verified.',
            ]);
        }

        DB::transaction(function () use ($user, $approver) {
            $user->forceFill([
                'email_verified_at' => $user->email_verified_at ?? now(),
                'status' => 'active',
                'approval_method' => 'manual',
                'approved_by' => $approver->id,
                'approved_at' => now(),
                'is_active' => true,
            ])->save();

            $user->logActivity(
                action: 'manual_approval',
                description: "User account manually approved by Super Admin ({$approver->name})",
                metadata: [
                    'approved_by_id' => $approver->id,
                    'approved_by_name' => $approver->name,
                    'approved_at' => now()->toIso8601String(),
                    'method' => 'manual',
                ],
                user: $approver
            );
        });

        try {
            $user->notify(new AccountApprovedNotification($approver));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to send AccountApprovedNotification to user {$user->id}: ".$e->getMessage());
        }

        return true;
    }

    /**
     * Reject user registration by Super Admin.
     */
    public function rejectUser(User $user, User $rejector, ?string $reason = null): void
    {
        if ($user->id === $rejector->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot reject your own account.',
            ]);
        }

        DB::transaction(function () use ($user, $rejector, $reason) {
            $user->forceFill([
                'status' => 'disabled',
                'is_active' => false,
            ])->save();

            $user->logActivity(
                action: 'approval_rejection',
                description: "User registration rejected by Super Admin ({$rejector->name})",
                metadata: [
                    'rejected_by_id' => $rejector->id,
                    'rejected_by_name' => $rejector->name,
                    'reason' => $reason,
                    'rejected_at' => now()->toIso8601String(),
                ],
                user: $rejector
            );
        });

        try {
            $user->notify(new AccountRejectedNotification($reason));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to send AccountRejectedNotification to user {$user->id}: ".$e->getMessage());
        }
    }

    /**
     * Revoke verification/approval for a user.
     */
    public function revokeVerification(User $user, User $revoker): void
    {
        if ($user->id === $revoker->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot revoke verification for your own account.',
            ]);
        }

        if ($user->hasRole('super_admin')) {
            throw ValidationException::withMessages([
                'user' => 'Cannot revoke verification for a Super Admin.',
            ]);
        }

        DB::transaction(function () use ($user, $revoker) {
            $user->forceFill([
                'email_verified_at' => null,
                'status' => 'pending_verification',
                'approval_method' => null,
                'approved_by' => null,
                'approved_at' => null,
            ])->save();

            $user->logActivity(
                action: 'manual_revocation',
                description: "User email verification revoked by Super Admin ({$revoker->name})",
                metadata: [
                    'revoked_by_id' => $revoker->id,
                    'revoked_by_name' => $revoker->name,
                    'revoked_at' => now()->toIso8601String(),
                ],
                user: $revoker
            );
        });
    }

    /**
     * Bulk approve multiple users.
     */
    public function bulkApprove(array $userIds, User $approver): int
    {
        $users = User::whereIn('id', $userIds)->get();
        $approvedCount = 0;

        foreach ($users as $user) {
            if ($user->id === $approver->id) {
                continue;
            }

            try {
                $this->approveManually($user, $approver);
                $approvedCount++;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Bulk approval error for user {$user->id}: ".$e->getMessage());
            }
        }

        return $approvedCount;
    }

    /**
     * Bulk resend verification emails.
     */
    public function bulkResendVerification(array $userIds, User $triggeredBy): int
    {
        $users = User::whereIn('id', $userIds)->whereNull('email_verified_at')->get();
        $resentCount = 0;

        foreach ($users as $user) {
            try {
                $this->resendVerificationNotification($user, $triggeredBy);
                $resentCount++;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Bulk resend verification error for user {$user->id}: ".$e->getMessage());
            }
        }

        return $resentCount;
    }
}
