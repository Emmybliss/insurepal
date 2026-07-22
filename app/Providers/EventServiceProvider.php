<?php

namespace App\Providers;

use App\Events\ClaimStatusChanged;
use App\Events\CommunicationMessageSent;
use App\Events\CreditNoteGenerated;
use App\Events\DebitNoteGenerated;
use App\Events\MessageSent;
use App\Events\NotificationSent;
use App\Events\PaymentReceived;
use App\Events\PolicyAmended;
use App\Events\PolicyCancelled;
use App\Events\PolicyCreated;
use App\Events\PolicyIssued;
use App\Events\PolicyRenewed;
use App\Events\TicketStatusChanged;
use App\Jobs\CalculateCommission;
use App\Jobs\GeneratePolicyCertificate;
use App\Jobs\SendPolicyEmailNotification;
use App\Jobs\UpdateNaicomReport;
use App\Listeners\ClaimStatusChangeListener;
use App\Listeners\CommunicationMessageListener;
use App\Listeners\MessageSentListener;
use App\Listeners\NotificationSentListener;
use App\Listeners\PostCancellationCommissionEntry;
use App\Listeners\PostCreditNoteCommissionEntry;
use App\Listeners\PostDebitNoteCommissionEntry;
use App\Listeners\PostEndorsementCommissionEntry;
use App\Listeners\PostPolicyCommissionEntry;
use App\Listeners\PostRenewalCommissionEntry;
use App\Listeners\TicketStatusListener;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\Microsoft\MicrosoftExtendSocialite;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        ClaimStatusChanged::class => [
            ClaimStatusChangeListener::class,
        ],
        MessageSent::class => [
            MessageSentListener::class,
        ],
        NotificationSent::class => [
            NotificationSentListener::class,
        ],
        CommunicationMessageSent::class => [
            CommunicationMessageListener::class,
        ],
        TicketStatusChanged::class => [
            TicketStatusListener::class,
        ],
        PolicyIssued::class => [
            GeneratePolicyCertificate::class,
            SendPolicyEmailNotification::class,
            UpdateNaicomReport::class,
            CalculateCommission::class,
        ],
        PolicyCreated::class => [
            PostPolicyCommissionEntry::class,
        ],
        PolicyCancelled::class => [
            UpdateNaicomReport::class,
            PostCancellationCommissionEntry::class,
        ],
        PolicyRenewed::class => [
            UpdateNaicomReport::class,
            SendPolicyEmailNotification::class,
            PostRenewalCommissionEntry::class,
        ],
        PolicyAmended::class => [
            PostEndorsementCommissionEntry::class,
        ],
        PaymentReceived::class => [
            CalculateCommission::class,
        ],
        DebitNoteGenerated::class => [
            UpdateNaicomReport::class,
            PostDebitNoteCommissionEntry::class,
        ],
        CreditNoteGenerated::class => [
            UpdateNaicomReport::class,
            PostCreditNoteCommissionEntry::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();

        Event::listen(
            SocialiteWasCalled::class,
            [MicrosoftExtendSocialite::class, 'handle']
        );
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
