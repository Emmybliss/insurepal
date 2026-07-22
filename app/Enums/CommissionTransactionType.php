<?php

namespace App\Enums;

enum CommissionTransactionType: string
{
    case Policy = 'policy';
    case CreditNote = 'credit_note';
    case DebitNote = 'debit_note';
    case Endorsement = 'endorsement';
    case Cancellation = 'cancellation';
    case Reversal = 'reversal';
    case ManualAdjustment = 'manual_adjustment';
    case Renewal = 'renewal';

    public function label(): string
    {
        return match ($this) {
            self::Policy => 'Policy',
            self::CreditNote => 'Credit Note',
            self::DebitNote => 'Debit Note',
            self::Endorsement => 'Endorsement',
            self::Cancellation => 'Cancellation',
            self::Reversal => 'Reversal',
            self::ManualAdjustment => 'Manual Adjustment',
            self::Renewal => 'Renewal',
        };
    }

    public function sign(): string
    {
        return match ($this) {
            self::Policy, self::DebitNote, self::Renewal => '+',
            self::CreditNote, self::Cancellation => '-',
            self::Endorsement, self::Reversal, self::ManualAdjustment => '±',
        };
    }

    public function isPositive(): bool
    {
        return $this->sign() === '+';
    }

    public function isNegative(): bool
    {
        return $this->sign() === '-';
    }
}
