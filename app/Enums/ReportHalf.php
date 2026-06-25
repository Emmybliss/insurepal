<?php

namespace App\Enums;

enum ReportHalf: string
{
    case H1 = 'H1';
    case H2 = 'H2';

    public function label(): string
    {
        return match ($this) {
            self::H1 => 'First Half (Jan–Jun)',
            self::H2 => 'Second Half (Jul–Dec)',
        };
    }
}
