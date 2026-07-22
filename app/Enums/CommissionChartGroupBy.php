<?php

namespace App\Enums;

enum CommissionChartGroupBy: string
{
    case Date = 'date';
    case PolicyClass = 'policy_class';
    case PolicyProduct = 'policy_product';

    public function label(): string
    {
        return match ($this) {
            self::Date => 'By Date',
            self::PolicyClass => 'By Policy Class',
            self::PolicyProduct => 'By Policy Product',
        };
    }
}
