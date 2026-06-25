<?php

namespace App\Enums;

enum PlacementStatus: string
{
    case Draft = 'draft';
    case InMarket = 'in_market';
    case Accepted = 'accepted';
    case PartiallyAccepted = 'partially_accepted';
    case Declined = 'declined';
    case Bound = 'bound';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::InMarket => 'In Market',
            self::Accepted => 'Accepted',
            self::PartiallyAccepted => 'Partially Accepted',
            self::Declined => 'Declined',
            self::Bound => 'Bound',
            self::Cancelled => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::InMarket => 'blue',
            self::Accepted => 'green',
            self::PartiallyAccepted => 'yellow',
            self::Declined => 'red',
            self::Bound => 'emerald',
            self::Cancelled => 'slate',
        };
    }
}
