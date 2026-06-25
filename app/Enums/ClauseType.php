<?php

namespace App\Enums;

enum ClauseType: string
{
    case Coverage = 'coverage';
    case Warranty = 'warranty';
    case Exclusion = 'exclusion';
    case Subjectivity = 'subjectivity';
    case Condition = 'condition';
    case Special = 'special';

    public function label(): string
    {
        return match ($this) {
            self::Coverage => 'Coverage Clause',
            self::Warranty => 'Warranty',
            self::Exclusion => 'Exclusion',
            self::Subjectivity => 'Subjectivity',
            self::Condition => 'Condition',
            self::Special => 'Special Condition',
        };
    }
}
