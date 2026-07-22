<?php

namespace App\Policies;

use App\Models\User;

class TenantAccessPolicy
{
    public function access(User $user, $model): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        return $model->tenant_id === $user->tenant_id;
    }
}
