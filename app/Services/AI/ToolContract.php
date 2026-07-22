<?php

namespace App\Services\AI;

use App\Models\User;

interface ToolContract
{
    public function name(): string;

    public function description(): string;

    public function schema(): array;

    public function execute(array $params, User $user): ToolResult;

    public function authorize(User $user): bool;

    public function requiresApproval(): bool;
}
