<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Services\Email\Providers\ImapProvider;

$account = EmailAccount::find(5);
if (! $account) {
    echo "Account 5 not found\n";
    exit(1);
}

echo "Account: {$account->email} on {$account->imap_host}:{$account->imap_port}\n";

$pass = $account->getDecryptedPassword();
$host = $account->imap_host;
$port = (int) ($account->imap_port ?: 993);

// Connect via socket and run LIST "" "*"
$context = stream_context_create([
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ],
]);

$address = "ssl://{$host}:{$port}";
$stream = @stream_socket_client($address, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $context);

if (! $stream) {
    echo "Connection failed: $errstr ($errno)\n";
    exit(1);
}

// Read banner
$banner = fgets($stream, 4096);
echo "Banner: $banner\n";

// Login
fwrite($stream, "A1 LOGIN \"{$account->email}\" \"{$pass}\"\r\n");
$loginRes = '';
while ($line = fgets($stream, 4096)) {
    $loginRes .= $line;
    if (str_starts_with($line, 'A1 OK') || str_starts_with($line, 'A1 NO') || str_starts_with($line, 'A1 BAD')) {
        break;
    }
}
echo "Login: $loginRes\n";

// List all folders
fwrite($stream, "A2 LIST \"\" \"*\"\r\n");
$listRes = '';
while ($line = fgets($stream, 4096)) {
    $listRes .= $line;
    if (str_starts_with($line, 'A2 OK') || str_starts_with($line, 'A2 NO') || str_starts_with($line, 'A2 BAD')) {
        break;
    }
}
echo "LIST Folders:\n$listRes\n";

// Now test fetchMessages for sent folder
$provider = new ImapProvider;
$sentFolder = EmailFolder::where('account_id', 5)->where('type', 'sent')->first();
if ($sentFolder) {
    echo "Testing fetchMessages for folder ID {$sentFolder->id} (remote_id: {$sentFolder->remote_id})...\n";
    $result = $provider->fetchMessages($account, $sentFolder, null);
    echo 'Fetched messages count: '.count($result['messages'] ?? [])."\n";
    echo 'Folder updated remote_id: '.$sentFolder->fresh()->remote_id."\n";
}

fwrite($stream, "A3 LOGOUT\r\n");
fclose($stream);
