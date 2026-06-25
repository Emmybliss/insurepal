<?php

namespace App\Enums;

enum AllocationType: string
{
    case Premium = 'premium';
    case Commission = 'commission';
    case Vat = 'vat';
    case Fee = 'fee';
    case Deposit = 'deposit';
    case Claim = 'claim';
    case ReturnPremium = 'return_premium';

    public function label(): string
    {
        return match ($this) {
            self::Premium => 'Premium',
            self::Commission => 'Commission',
            self::Vat => 'VAT',
            self::Fee => 'Fee',
            self::Deposit => 'Deposit',
            self::Claim => 'Claim',
            self::ReturnPremium => 'Return Premium',
        };
    }
}
