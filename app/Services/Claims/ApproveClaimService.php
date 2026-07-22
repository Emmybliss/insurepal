<?php

namespace App\Services\Claims;

use App\Events\ClaimStatusChanged;
use App\Models\Claim;
use App\Models\User;
use App\Notifications\AdditionalInfoRequested;
use App\Notifications\ClaimApproved;
use App\Notifications\ClaimRejected;
use App\Notifications\ClaimStatusUpdated;

class ApproveClaimService
{
    public function submit(Claim $claim, User $user): void
    {
        $oldStatus = $claim->status;

        $claim->submit($user);

        event(new ClaimStatusChanged($claim, $oldStatus, $claim->status, $user));
    }

    public function startReview(Claim $claim, User $reviewer): void
    {
        $oldStatus = $claim->status;

        $claim->startReview($reviewer);

        event(new ClaimStatusChanged($claim, $oldStatus, $claim->status, $reviewer));
    }

    public function approve(Claim $claim, User $reviewer, float $approvedAmount, ?string $notes = null): void
    {
        if ($approvedAmount > (float) $claim->claim_amount) {
            throw new \InvalidArgumentException('The approved amount may not exceed the original claim amount.');
        }

        $oldStatus = $claim->status;

        $claim->approve($reviewer, $approvedAmount, $notes);

        $claim->customer->notify(new ClaimApproved($claim, $approvedAmount));

        if ($claim->policy && $claim->policy->customer && $claim->policy->customer->id !== $claim->customer_id) {
            $claim->policy->customer->notify(new ClaimStatusUpdated($claim, $oldStatus, $claim->status));
        }

        event(new ClaimStatusChanged($claim, $oldStatus, $claim->status, $reviewer));
    }

    public function reject(Claim $claim, User $reviewer, string $reason): void
    {
        $oldStatus = $claim->status;

        $claim->reject($reviewer, $reason);

        $claim->customer->notify(new ClaimRejected($claim, $reason));

        if ($claim->policy && $claim->policy->customer && $claim->policy->customer->id !== $claim->customer_id) {
            $claim->policy->customer->notify(new ClaimStatusUpdated($claim, $oldStatus, $claim->status));
        }

        event(new ClaimStatusChanged($claim, $oldStatus, $claim->status, $reviewer));
    }

    public function requestAdditionalInfo(Claim $claim, User $reviewer, string $message): void
    {
        $claim->requestAdditionalInfo($reviewer, $message);

        $claim->customer->notify(new AdditionalInfoRequested($claim, $message));
    }
}
