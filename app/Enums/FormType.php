<?php

namespace App\Enums;

enum FormType: string
{
    case Form72A = '7.2A';
    case Form72B = '7.2B';
    case Form72C = '7.2C';

    public function label(): string
    {
        return match ($this) {
            self::Form72A => 'Form 7.2A – Balance Sheet',
            self::Form72B => 'Form 7.2B – Statement of Business',
            self::Form72C => 'Form 7.2C – Remittance Schedule',
        };
    }
}
