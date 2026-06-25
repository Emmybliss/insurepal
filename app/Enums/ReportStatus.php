<?php

namespace App\Enums;

enum ReportStatus: string
{
    case Draft = 'draft';
    case Generating = 'generating';
    case Generated = 'generated';
    case ValidationFailed = 'validation_failed';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Locked = 'locked';
    case Exported = 'exported';
    case Submitted = 'submitted';
    case Restated = 'restated';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Generating => 'Generating',
            self::Generated => 'Generated',
            self::ValidationFailed => 'Validation Failed',
            self::UnderReview => 'Under Review',
            self::Approved => 'Approved',
            self::Locked => 'Locked',
            self::Exported => 'Exported',
            self::Submitted => 'Submitted',
            self::Restated => 'Restated',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Generating => 'yellow',
            self::Generated => 'blue',
            self::ValidationFailed => 'red',
            self::UnderReview => 'orange',
            self::Approved => 'green',
            self::Locked => 'purple',
            self::Exported => 'indigo',
            self::Submitted => 'teal',
            self::Restated => 'pink',
        };
    }
}
