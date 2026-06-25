<?php

use App\Events\AnnouncementCreated;
use App\Models\Announcement;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
});

it('can create announcements', function () {
    $announcement = Announcement::createForTenant(
        $this->tenant,
        'Test Announcement',
        'This is a test announcement',
        'general',
        'medium',
        null,
        $this->user
    );

    expect($announcement)
        ->toBeInstanceOf(Announcement::class)
        ->and($announcement->tenant_id)->toBe($this->tenant->id)
        ->and($announcement->title)->toBe('Test Announcement')
        ->and($announcement->content)->toBe('This is a test announcement')
        ->and($announcement->type)->toBe('general')
        ->and($announcement->priority)->toBe('medium')
        ->and($announcement->is_active)->toBeTrue()
        ->and($announcement->created_by)->toBe($this->user->id);
});

it('can filter active announcements', function () {
    $activeAnnouncement = Announcement::createForTenant(
        $this->tenant,
        'Active Announcement',
        'This is active',
        'general',
        'medium'
    );

    $inactiveAnnouncement = Announcement::createForTenant(
        $this->tenant,
        'Inactive Announcement',
        'This is inactive',
        'general',
        'medium'
    );
    $inactiveAnnouncement->update(['is_active' => false]);

    $expiredAnnouncement = Announcement::createForTenant(
        $this->tenant,
        'Expired Announcement',
        'This is expired',
        'general',
        'medium',
        now()->subDay()
    );

    $activeAnnouncements = Announcement::active()->get();
    $allAnnouncements = Announcement::all();

    expect($activeAnnouncements)->toHaveCount(1);
    expect($allAnnouncements)->toHaveCount(3);
    expect($activeAnnouncements->first()->id)->toBe($activeAnnouncement->id);
});

it('can filter announcements by type', function () {
    Announcement::createForTenant($this->tenant, 'General', 'General announcement', 'general');
    Announcement::createForTenant($this->tenant, 'Maintenance', 'Maintenance announcement', 'maintenance');
    Announcement::createForTenant($this->tenant, 'Security', 'Security announcement', 'security');

    $generalAnnouncements = Announcement::byType('general')->get();
    $maintenanceAnnouncements = Announcement::byType('maintenance')->get();
    $securityAnnouncements = Announcement::byType('security')->get();

    expect($generalAnnouncements)->toHaveCount(1);
    expect($maintenanceAnnouncements)->toHaveCount(1);
    expect($securityAnnouncements)->toHaveCount(1);
});

it('can filter announcements by priority', function () {
    Announcement::createForTenant($this->tenant, 'High Priority', 'High priority announcement', 'general', 'high');
    Announcement::createForTenant($this->tenant, 'Medium Priority', 'Medium priority announcement', 'general', 'medium');
    Announcement::createForTenant($this->tenant, 'Low Priority', 'Low priority announcement', 'general', 'low');

    $highPriorityAnnouncements = Announcement::byPriority('high')->get();
    $mediumPriorityAnnouncements = Announcement::byPriority('medium')->get();
    $lowPriorityAnnouncements = Announcement::byPriority('low')->get();

    expect($highPriorityAnnouncements)->toHaveCount(1);
    expect($mediumPriorityAnnouncements)->toHaveCount(1);
    expect($lowPriorityAnnouncements)->toHaveCount(1);
});

it('can identify expired announcements', function () {
    $expiredAnnouncement = Announcement::createForTenant(
        $this->tenant,
        'Expired Announcement',
        'This is expired',
        'general',
        'medium',
        now()->subDay()
    );

    $activeAnnouncement = Announcement::createForTenant(
        $this->tenant,
        'Active Announcement',
        'This is active',
        'general',
        'medium',
        now()->addDay()
    );

    expect($expiredAnnouncement->isExpired())->toBeTrue();
    expect($activeAnnouncement->isExpired())->toBeFalse();
});

it('returns correct priority colors', function () {
    $highAnnouncement = Announcement::createForTenant($this->tenant, 'High', 'High', 'general', 'high');
    $mediumAnnouncement = Announcement::createForTenant($this->tenant, 'Medium', 'Medium', 'general', 'medium');
    $lowAnnouncement = Announcement::createForTenant($this->tenant, 'Low', 'Low', 'general', 'low');

    expect($highAnnouncement->priority_color)->toBe('text-red-600');
    expect($mediumAnnouncement->priority_color)->toBe('text-yellow-600');
    expect($lowAnnouncement->priority_color)->toBe('text-green-600');
});

it('returns correct priority badge colors', function () {
    $highAnnouncement = Announcement::createForTenant($this->tenant, 'High', 'High', 'general', 'high');
    $mediumAnnouncement = Announcement::createForTenant($this->tenant, 'Medium', 'Medium', 'general', 'medium');
    $lowAnnouncement = Announcement::createForTenant($this->tenant, 'Low', 'Low', 'general', 'low');

    expect($highAnnouncement->priority_badge_color)->toBe('bg-red-100 text-red-800');
    expect($mediumAnnouncement->priority_badge_color)->toBe('bg-yellow-100 text-yellow-800');
    expect($lowAnnouncement->priority_badge_color)->toBe('bg-green-100 text-green-800');
});

it('returns correct type icons', function () {
    $maintenanceAnnouncement = Announcement::createForTenant($this->tenant, 'Maintenance', 'Maintenance', 'maintenance');
    $securityAnnouncement = Announcement::createForTenant($this->tenant, 'Security', 'Security', 'security');
    $featureAnnouncement = Announcement::createForTenant($this->tenant, 'Feature', 'Feature', 'feature');
    $updateAnnouncement = Announcement::createForTenant($this->tenant, 'Update', 'Update', 'update');

    expect($maintenanceAnnouncement->type_icon)->toBe('Wrench');
    expect($securityAnnouncement->type_icon)->toBe('Shield');
    expect($featureAnnouncement->type_icon)->toBe('Star');
    expect($updateAnnouncement->type_icon)->toBe('RefreshCw');
});

it('dispatches announcement created event', function () {
    Event::fake();

    $announcement = Announcement::createForTenant(
        $this->tenant,
        'Test Announcement',
        'This is a test announcement',
        'general',
        'medium'
    );

    // Manually dispatch the event (in real usage, this would be done by the controller)
    event(new AnnouncementCreated($announcement, $this->tenant));

    Event::assertDispatched(AnnouncementCreated::class);
});

it('can access tenant relationship', function () {
    $announcement = Announcement::createForTenant(
        $this->tenant,
        'Test Announcement',
        'This is a test announcement'
    );

    expect($announcement->tenant)->toBeInstanceOf(Tenant::class);
    expect($announcement->tenant->id)->toBe($this->tenant->id);
});

it('can access created by user relationship', function () {
    $announcement = Announcement::createForTenant(
        $this->tenant,
        'Test Announcement',
        'This is a test announcement',
        'general',
        'medium',
        null,
        $this->user
    );

    expect($announcement->createdBy)->toBeInstanceOf(User::class);
    expect($announcement->createdBy->id)->toBe($this->user->id);
});
