<?php

namespace App\Enums;

enum TransactionType: string
{
    case New = 'new';
    case Renewal = 'renewal';
    case Endorsement = 'endorsement';
    case AdditionalPremium = 'additional_premium';
    case Adjustment = 'adjustment';
    case Reinstatement = 'reinstatement';
    case Replacement = 'replacement';
    case Extension = 'extension';
    case ShortPeriod = 'short_period';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New Business',
            self::Renewal => 'Renewal',
            self::Endorsement => 'Endorsement',
            self::AdditionalPremium => 'Additional Premium',
            self::Adjustment => 'Adjustment',
            self::Reinstatement => 'Reinstatement',
            self::Replacement => 'Replacement',
            self::Extension => 'Extension',
            self::ShortPeriod => 'Short Period',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function options(): array
    {
        return array_reduce(self::cases(), function (array $carry, self $case) {
            $carry[$case->value] = $case->label();

            return $carry;
        }, []);
    }
}
