<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Services\Email\Providers\ImapProvider;

$account = EmailAccount::find(5);
$folder = EmailFolder::where('account_id', 5)->where('type', 'sent')->first();

echo "Folder details: ID={$folder->id}, Name={$folder->name}, RemoteID={$folder->remote_id}\n";

$provider = new ImapProvider;
$result = $provider->fetchMessages($account, $folder, '0');

echo 'Fetched messages count for Sent folder: '.count($result['messages'] ?? [])."\n";
echo 'Next cursor: '.($result['next_cursor'] ?? 'null')."\n";

if (! empty($result['messages'])) {
    echo 'First message subject: '.($result['messages'][0]['subject'] ?? 'No subject')."\n";
    echo 'First message remote_id: '.($result['messages'][0]['message_id_remote'] ?? 'No remote_id')."\n";
}
