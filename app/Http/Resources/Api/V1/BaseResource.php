<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

abstract class BaseResource extends JsonResource
{
    protected function includeRelation(string $relation): bool
    {
        return $this->relationLoaded($relation);
    }

    protected function whenRelationLoaded(string $relation, mixed $value, mixed $default = null): mixed
    {
        return $this->when($this->includeRelation($relation), $value, $default);
    }

    public static function collection($resource): BaseCollection
    {
        $class = get_called_class();

        return new class($resource, $class) extends BaseCollection
        {
            public function __construct($resource, private string $resourceClass)
            {
                parent::__construct($resource);
            }

            protected function wraps(): string
            {
                return 'data';
            }

            public function toArray(Request $request): array
            {
                return [
                    'data' => $this->collection->map(fn ($item) => (new ($this->resourceClass)($item))->toArray($request)),
                ];
            }
        };
    }
}
