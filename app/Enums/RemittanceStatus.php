<?php

namespace App\Enums;

enum RemittanceStatus: string
{
    case Draft = 'draft';
    case Completed = 'completed';
    case Reversed = 'reversed';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Completed => 'Completed',
            self::Reversed => 'Reversed',
            self::Failed => 'Failed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Completed => 'green',
            self::Reversed => 'red',
            self::Failed => 'orange',
        };
    }
}
