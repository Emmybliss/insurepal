<?php

namespace App\Services\AI;

class ToolResult
{
    public function __construct(
        public readonly bool $success,
        public readonly mixed $data = null,
        public readonly ?string $message = null,
        public readonly ?string $error = null,
    ) {}
}
