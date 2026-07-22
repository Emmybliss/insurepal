<?php

namespace App\Services;

use App\Models\ClauseLibrary;
use App\Models\User;

class ClauseLibraryService
{
    public function getClauses(User $user, ?string $type = null, ?int $policyClassId = null, bool $includeSystem = true)
    {
        $query = ClauseLibrary::query()
            ->active()
            ->byClass($policyClassId);

        if ($includeSystem) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('tenant_id')
                    ->orWhere('tenant_id', $user->tenant_id);
            });
        } else {
            $query->forTenant($user->tenant_id);
        }

        if ($type) {
            $query->byType($type);
        }

        return $query->orderBy('sort_order')->orderBy('title')->get();
    }

    public function createClause(User $user, array $data): ClauseLibrary
    {
        return ClauseLibrary::create([
            'tenant_id' => $user->tenant_id,
            'clause_type' => $data['clause_type'],
            'title' => $data['title'],
            'content' => $data['content'],
            'policy_class_id' => $data['policy_class_id'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
    }

    public function updateClause(ClauseLibrary $clause, array $data): ClauseLibrary
    {
        $clause->update($data);

        return $clause->fresh();
    }

    public function deleteClause(ClauseLibrary $clause): bool
    {
        if ($clause->is_system) {
            throw new \Exception('System clauses cannot be deleted.');
        }

        return $clause->delete();
    }
}
