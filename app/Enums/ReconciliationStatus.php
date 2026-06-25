<?php

namespace App\Enums;

enum ReconciliationStatus: string
{
    case Draft = 'draft';
    case Reconciled = 'reconciled';
    case DifferenceIdentified = 'difference_identified';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Reconciled => 'Reconciled',
            self::DifferenceIdentified => 'Difference Identified',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Reconciled => 'green',
            self::DifferenceIdentified => 'red',
        };
    }
}
