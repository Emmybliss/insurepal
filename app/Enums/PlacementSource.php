<?php

namespace App\Enums;

enum PlacementSource: string
{
    case Quote = 'quote';
    case Manual = 'manual';
    case BrokerSlipDirect = 'broker_slip_direct';

    public function label(): string
    {
        return match ($this) {
            self::Quote => 'Quote',
            self::Manual => 'Manual',
            self::BrokerSlipDirect => 'Broker Slip Direct',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Quote => 'blue',
            self::Manual => 'gray',
            self::BrokerSlipDirect => 'amber',
        };
    }
}
