<?php

namespace App\Services\AI;

class ToolRegistry
{
    private array $tools = [];

    public function register(ToolContract $tool): void
    {
        $this->tools[$tool->name()] = $tool;
    }

    public function get(string $name): ?ToolContract
    {
        return $this->tools[$name] ?? null;
    }

    public function hasTool(string $name): bool
    {
        return isset($this->tools[$name]);
    }

    public function all(): array
    {
        return $this->tools;
    }

    public function schemas(): array
    {
        return array_map(fn (ToolContract $tool) => [
            'name' => $tool->name(),
            'description' => $tool->description(),
            'schema' => $tool->schema(),
            'requires_approval' => $tool->requiresApproval(),
        ], $this->tools);
    }
}
