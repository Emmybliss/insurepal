<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('policies:process-expirations')->dailyAt('08:00');
Schedule::command('reports:process-scheduled')->dailyAt('02:00');
Schedule::command('notifications:payment-due-reminders')->dailyAt('08:00');
Schedule::command('policies:send-expiry-notifications')->dailyAt('08:00');
Schedule::command('recycle-bin:prune')->dailyAt('02:00');
