<?php

namespace App\Enums;

enum RiskMode: string
{
    case Single = 'single';
    case Scheduled = 'scheduled';
    case Mixed = 'mixed';
}
