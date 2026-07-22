<?php

namespace App\Services\AI;

use App\Models\User;

class ContextManager
{
    public function getContext(User $user, ?string $type = null, ?int $id = null): array
    {
        $context = [
            'tenant' => [
                'name' => $user->tenant?->name,
                'type' => $user->tenant?->type,
            ],
            'user' => [
                'name' => $user->name,
                'roles' => $user->roles->pluck('name'),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ];

        if ($type && $id) {
            $context['active_resource'] = $this->getResourceContext($type, $id);
        }

        return $context;
    }

    private function getResourceContext(string $type, int $id): ?array
    {
        return match ($type) {
            'customer' => \App\Models\Customer::with('policies')->find($id)?->toArray(),
            'policy' => \App\Models\Policy::with('customer', 'policyProduct')->find($id)?->toArray(),
            'claim' => \App\Models\Claim::with('customer', 'policy')->find($id)?->toArray(),
            'quote' => \App\Models\Quote::with('customer', 'insuranceProduct')->find($id)?->toArray(),
            default => null,
        };
    }
}
