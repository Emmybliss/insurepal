<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\EmailAccount;
use App\Services\Email\EmailSyncService;

$account = EmailAccount::find(5);
if (! $account) {
    echo "Account 5 not found\n";
    exit(1);
}

echo "Starting full sync for {$account->email}...\n";

$syncService = app(EmailSyncService::class);
$result = $syncService->fullSync($account);

echo 'Sync result: '.json_encode($result, JSON_PRETTY_PRINT)."\n";

$folders = $account->folders()->withCount('messages')->get();
foreach ($folders as $f) {
    echo "Folder: {$f->name} (type: {$f->type}, remote_id: {$f->remote_id}) => {$f->messages_count} messages\n";
}
