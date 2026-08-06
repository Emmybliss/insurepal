<?php

namespace App\Enums;

enum QuoteStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case ChangesRequested = 'changes_requested';
    case Approved = 'approved';
    case Sent = 'sent';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Converted = 'converted';
    case Superseded = 'superseded';
    case Withdrawn = 'withdrawn';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::PendingReview => 'Pending Review',
            self::ChangesRequested => 'Changes Requested',
            self::Approved => 'Approved',
            self::Sent => 'Sent to Customer',
            self::Accepted => 'Accepted',
            self::Rejected => 'Rejected',
            self::Converted => 'Converted to Policy',
            self::Superseded => 'Superseded',
            self::Withdrawn => 'Withdrawn',
            self::Expired => 'Expired',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::PendingReview => 'yellow',
            self::ChangesRequested => 'orange',
            self::Approved => 'emerald',
            self::Sent => 'blue',
            self::Accepted => 'green',
            self::Rejected => 'red',
            self::Converted => 'purple',
            self::Superseded => 'slate',
            self::Withdrawn => 'zinc',
            self::Expired => 'amber',
        };
    }
}
