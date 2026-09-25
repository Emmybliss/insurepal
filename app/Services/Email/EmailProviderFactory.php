<?php

namespace App\Services\Email;

use App\Models\EmailAccount;
use App\Services\Email\Contracts\EmailProviderInterface;
use App\Services\Email\Providers\GmailProvider;
use App\Services\Email\Providers\ImapProvider;
use App\Services\Email\Providers\MicrosoftGraphProvider;
use App\Services\Email\Providers\SmtpProvider;

class EmailProviderFactory
{
    public function make(EmailAccount $account): EmailProviderInterface
    {
        return match ($account->provider) {
            'gmail' => new GmailProvider,
            'microsoft365' => new MicrosoftGraphProvider,
            'smtp' => new SmtpProvider,
            'imap' => new ImapProvider,
            default => new SmtpProvider,
        };
    }
}
