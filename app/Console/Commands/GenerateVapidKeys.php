<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'pwa:generate-vapid';

    /**
     * The console command description.
     */
    protected $description = 'Generate VAPID public/private key pair for Web Push notifications';

    public function handle(): int
    {
        $this->info('Generating VAPID key pair for Web Push...');
        $this->newLine();

        try {
            $keys = VAPID::createVapidKeys();

            $publicKey = $keys['publicKey'];
            $privateKey = $keys['privateKey'];

            $this->line('Add the following to your <comment>.env</comment> file:');
            $this->newLine();
            $this->line("VAPID_PUBLIC_KEY={$publicKey}");
            $this->line("VAPID_PRIVATE_KEY={$privateKey}");
            $this->line('VAPID_SUBJECT=mailto:hello@insurepal.com');
            $this->newLine();

            $this->info('✓ Done! Keep VAPID_PRIVATE_KEY secret and never commit it to version control.');
            $this->warn('  The VAPID_PUBLIC_KEY must match what is passed to the frontend VITE_VAPID_PUBLIC_KEY.');

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to generate VAPID keys: '.$e->getMessage());
            $this->newLine();
            $this->warn('This usually happens on Windows if PHP cannot find your openssl.cnf file.');
            $this->line('You can generate keys manually using one of these methods:');
            $this->newLine();
            $this->line('1. Online: <info>https://web-push-codelab.glitch.me/</info>');
            $this->line('2. CLI (if you have Node installed): <info>npx web-push generate-vapid-keys</info>');
            $this->newLine();
            $this->line('Once you have the keys, add them to your .env manually:');
            $this->line('VAPID_PUBLIC_KEY=...');
            $this->line('VAPID_PRIVATE_KEY=...');
            $this->line('VAPID_SUBJECT=mailto:your@email.com');

            return self::FAILURE;
        }
    }
}
