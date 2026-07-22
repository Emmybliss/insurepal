<?php

namespace App\Services\Claims;

use App\Models\Claim;
use App\Models\User;

class SettleClaimService
{
    public function settle(Claim $claim, User $user, ?string $notes = null): void
    {
        $claim->settle($user, $notes);
    }

    public function close(Claim $claim, User $user, ?string $notes = null): void
    {
        $claim->close($user, $notes);
    }
}
