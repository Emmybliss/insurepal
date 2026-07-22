<?php

namespace App\DTOs\Naicom;

class Form72BDTO
{
    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, array<string, mixed>>  $monthlySummaries
     * @param  array<string, mixed>  $period
     */
    public function __construct(
        public readonly array $rows,
        public readonly array $monthlySummaries,
        public readonly array $period,
    ) {}

    public function toArray(): array
    {
        return [
            'rows' => $this->rows,
            'monthly_summaries' => $this->monthlySummaries,
            'period' => $this->period,
        ];
    }
}
