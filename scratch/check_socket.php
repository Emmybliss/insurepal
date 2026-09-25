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

$context = stream_context_create([
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
    ],
]);

$stream = stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $context);
if (! $stream) {
    echo "Connection failed: $errstr\n";
    exit(1);
}

fgets($stream, 1024);

fwrite($stream, "A1 LOGIN \"{$email}\" \"{$password}\"\r\n");
$res = '';
while ($line = fgets($stream, 1024)) {
    $res .= $line;
    if (str_contains($line, 'A1 OK') || str_contains($line, 'A1 NO') || str_contains($line, 'A1 BAD')) {
        break;
    }
}

$folders = ['INBOX', 'INBOX.Sent', 'INBOX.Drafts', 'INBOX.Trash', 'INBOX.spam', 'INBOX.Archive', 'Sent', 'Drafts', 'Trash', 'Junk', 'Spam'];

foreach ($folders as $i => $f) {
    $tag = 'A'.($i + 2);
    fwrite($stream, "{$tag} SELECT \"{$f}\"\r\n");
    $selRes = '';
    while ($line = fgets($stream, 1024)) {
        $selRes .= $line;
        if (str_contains($line, "{$tag} OK") || str_contains($line, "{$tag} NO") || str_contains($line, "{$tag} BAD")) {
            break;
        }
    }

    if (str_contains($selRes, "{$tag} OK")) {
        $searchTag = 'S'.($i + 2);
        fwrite($stream, "{$searchTag} UID SEARCH ALL\r\n");
        $searchRes = '';
        while ($line = fgets($stream, 1024)) {
            $searchRes .= $line;
            if (str_contains($line, "{$searchTag} OK") || str_contains($line, "{$searchTag} NO") || str_contains($line, "{$searchTag} BAD")) {
                break;
            }
        }

        $uids = [];
        if (preg_match('/\* SEARCH ([\d\s]+)/i', $searchRes, $matches)) {
            $uids = array_filter(explode(' ', trim($matches[1])));
        }
        echo "Remote Folder '{$f}' => ".count($uids).' messages. UIDs: '.implode(', ', $uids)."\n";
    } else {
        echo "Folder '{$f}' does not exist on server.\n";
    }
}

fwrite($stream, "Z LOGOUT\r\n");
fclose($stream);
