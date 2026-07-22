<?php

namespace App\Services\Concerns;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

trait HandlesListing
{
    protected function applyPagination(Builder $query, int $perPage = 15, int $maxPerPage = 100): LengthAwarePaginator
    {
        return $query->paginate(min($perPage, $maxPerPage))->withQueryString();
    }

    protected function applySearch(Builder $query, ?string $term, array $columns = []): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term, $columns) {
            $first = true;
            foreach ($columns as $column) {
                if (str_contains($column, '.')) {
                    [$relation, $field] = explode('.', $column, 2);
                    if ($first) {
                        $q->whereHas($relation, fn (Builder $sq) => $sq->where($field, 'like', "%{$term}%"));
                        $first = false;
                    } else {
                        $q->orWhereHas($relation, fn (Builder $sq) => $sq->where($field, 'like', "%{$term}%"));
                    }
                } else {
                    if ($first) {
                        $q->where($column, 'like', "%{$term}%");
                        $first = false;
                    } else {
                        $q->orWhere($column, 'like', "%{$term}%");
                    }
                }
            }
        });
    }

    protected function applySort(Builder $query, ?string $sort, array $allowedColumns = [], string $defaultColumn = 'created_at', string $defaultDirection = 'desc'): Builder
    {
        $sort = $sort ?? "-{$defaultColumn}";
        $column = ltrim($sort, '-');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';

        if (! empty($allowedColumns) && ! in_array($column, $allowedColumns, true)) {
            $column = $defaultColumn;
            $direction = $defaultDirection;
        }

        return $query->orderBy($column, $direction);
    }

    protected function applyDateRange(Builder $query, ?string $from, ?string $to, string $column = 'created_at'): Builder
    {
        if ($from) {
            $query->whereDate($column, '>=', $from);
        }

        if ($to) {
            $query->whereDate($column, '<=', $to);
        }

        return $query;
    }
}
