<?php

namespace App\Http\Resources\Mobile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'roles' => $this->roles->pluck('name')->toArray(),
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at?->toISOString(),
        ];
    }
}
