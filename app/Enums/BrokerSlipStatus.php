<?php

namespace App\Enums;

enum BrokerSlipStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case ChangesRequested = 'changes_requested';
    case Approved = 'approved';
    case Issued = 'issued';
    case Superseded = 'superseded';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingReview => 'Pending Review',
            self::ChangesRequested => 'Changes Requested',
            self::Approved => 'Approved',
            self::Issued => 'Issued',
            self::Superseded => 'Superseded',
            self::Withdrawn => 'Withdrawn',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::PendingReview => 'yellow',
            self::ChangesRequested => 'orange',
            self::Approved => 'emerald',
            self::Issued => 'green',
            self::Superseded => 'blue',
            self::Withdrawn => 'slate',
        };
    }
}
