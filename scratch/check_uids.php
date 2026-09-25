<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\EmailAccount;

$account = EmailAccount::find(5);
$host = $account->imap_host;
$port = (int) $account->imap_port;
$password = $account->getDecryptedPassword();
$email = $account->email;

$mbx = "{{$host}:{$port}/imap/ssl}";

$folders = [
    'INBOX',
    'INBOX.Sent',
    'INBOX.Drafts',
    'INBOX.Trash',
    'INBOX.spam',
    'INBOX.Archive',
];

foreach ($folders as $f) {
    $full = $mbx.$f;
    $inbox = @imap_open($full, $email, $password);
    if ($inbox) {
        $uids = imap_search($inbox, 'ALL', SE_UID);
        $count = $uids ? count($uids) : 0;
        echo "IMAP Remote Folder {$f} => Total messages on server: {$count} (UIDs: ".implode(', ', $uids ?: []).")\n";
        imap_close($inbox);
    } else {
        echo "Failed to open {$f}: ".imap_last_error()."\n";
    }
}
