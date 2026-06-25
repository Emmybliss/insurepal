<?php

namespace App\Enums;

enum InsurerResponse: string
{
    case Accepted = 'accepted';
    case AcceptedWithConditions = 'accepted_with_conditions';
    case CounterOffer = 'counter_offer';
    case MoreInfoRequested = 'more_info_requested';
    case Declined = 'declined';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::Accepted => 'Accepted',
            self::AcceptedWithConditions => 'Accepted with Conditions',
            self::CounterOffer => 'Counter Offer',
            self::MoreInfoRequested => 'More Information Requested',
            self::Declined => 'Declined',
            self::Withdrawn => 'Withdrawn',
        };
    }

    public function isPositive(): bool
    {
        return match ($this) {
            self::Accepted, self::AcceptedWithConditions => true,
            default => false,
        };
    }
}
