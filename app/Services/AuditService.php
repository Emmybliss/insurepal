<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    public function log(
        string $action,
        Model $subject,
        User $user,
        ?array $metadata = null,
        ?string $description = null,
    ): void {
        $subject->logActivity(
            $action,
            $description ?? $this->defaultDescription($action, $subject),
            $metadata,
            $user,
        );
    }

    public function logBatch(string $action, array $subjects, User $user): void
    {
        foreach ($subjects as $subject) {
            $this->log($action, $subject, $user);
        }
    }

    private function defaultDescription(string $action, Model $subject): string
    {
        $modelName = class_basename($subject);

        return match ($action) {
            'created' => "{$modelName} created",
            'updated' => "{$modelName} updated",
            'deleted' => "{$modelName} deleted",
            'issued' => "{$modelName} issued",
            'cancelled' => "{$modelName} cancelled",
            'approved' => "{$modelName} approved",
            'rejected' => "{$modelName} rejected",
            'settled' => "{$modelName} settled",
            'submitted' => "{$modelName} submitted for approval",
            default => "{$action} on {$modelName}",
        };
    }
}
