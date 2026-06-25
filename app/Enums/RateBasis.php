<?php

namespace App\Enums;

enum RateBasis: string
{
    case Percentage = 'percentage';
    case PerMille = 'per_mille';
    case Fixed = 'fixed';

    public function label(): string
    {
        return match ($this) {
            self::Percentage => 'Percentage (%)',
            self::PerMille => 'Per Mille (‰)',
            self::Fixed => 'Fixed Amount',
        };
    }
}
