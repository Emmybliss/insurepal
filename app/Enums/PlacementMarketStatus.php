<?php

namespace App\Enums;

enum PlacementMarketStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Countered = 'countered';
    case Declined = 'declined';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Accepted => 'Accepted',
            self::Countered => 'Counter Offer',
            self::Declined => 'Declined',
            self::Withdrawn => 'Withdrawn',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'yellow',
            self::Accepted => 'green',
            self::Countered => 'blue',
            self::Declined => 'red',
            self::Withdrawn => 'gray',
        };
    }
}
