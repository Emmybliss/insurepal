<?php

use App\Enums\ReportStatus;
use App\Models\NaicomReportRun;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

    $this->run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'reporting_year' => now()->year,
        'reporting_half' => 'H1',
        'generated_by' => $this->user->id,
    ]);
});

it('denies access to index without naicom-reports.view permission', function () {
    $this->actingAs($this->user);

    $this->get(route('reports.naicom.index'))
        ->assertStatus(403);
});

it('denies access to create without naicom-reports.generate permission', function () {
    $this->actingAs($this->user);

    $this->get(route('reports.naicom.create'))
        ->assertStatus(403);
});

it('denies store without naicom-reports.generate permission', function () {
    $this->actingAs($this->user);

    $this->post(route('reports.naicom.store'), [
        'reporting_year' => now()->year,
        'reporting_half' => 'H1',
    ])->assertStatus(403);
});

it('denies show without naicom-reports.view permission', function () {
    $this->actingAs($this->user);

    $this->get(route('reports.naicom.show', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('denies form-7.2a without naicom-reports.view permission', function () {
    $this->actingAs($this->user);

    $this->get(route('reports.naicom.form-7.2a', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('denies form-7.2b without naicom-reports.view permission', function () {
    $this->actingAs($this->user);

    $this->get(route('reports.naicom.form-7.2b', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('denies form-7.2c without naicom-reports.view permission', function () {
    $this->actingAs($this->user);

    $this->get(route('reports.naicom.form-7.2c', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('denies submit-review without naicom-reports.review permission', function () {
    $this->actingAs($this->user);

    $this->post(route('reports.naicom.submit-review', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('denies approve without naicom-reports.approve permission', function () {
    $this->actingAs($this->user);

    $this->post(route('reports.naicom.approve', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('denies lock without naicom-reports.lock permission', function () {
    $this->actingAs($this->user);

    $this->post(route('reports.naicom.lock', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('denies export without naicom-reports.export permission', function () {
    $this->actingAs($this->user);

    $this->post(route('reports.naicom.export', ['reportRun' => $this->run, 'format' => 'xlsx']))
        ->assertStatus(403);
});

it('denies store adjustment without naicom-reports.adjust permission', function () {
    $this->actingAs($this->user);

    $this->post(route('reports.naicom.adjustments.store', ['reportRun' => $this->run]), [
        'form_type' => '7.2B',
        'adjusted_value' => 100,
        'reason' => 'Test adjustment with minimum length',
    ])->assertStatus(403);
});

it('denies adjustments page without naicom-reports.view permission', function () {
    $this->actingAs($this->user);

    $this->get(route('reports.naicom.adjustments', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('denies restate without naicom-reports.restate permission', function () {
    $this->actingAs($this->user);

    $this->post(route('reports.naicom.restate', ['reportRun' => $this->run]))
        ->assertStatus(403);
});

it('grants access to index with correct permission', function () {
    Permission::create(['name' => 'naicom-reports.view', 'guard_name' => 'web']);
    $this->user->givePermissionTo('naicom-reports.view');
    $this->actingAs($this->user);

    $this->get(route('reports.naicom.index'))
        ->assertStatus(200);
});

it('grants access to store with correct permission', function () {
    Permission::create(['name' => 'naicom-reports.generate', 'guard_name' => 'web']);
    $this->user->givePermissionTo('naicom-reports.generate');
    $this->actingAs($this->user);

    $this->post(route('reports.naicom.store'), [
        'reporting_year' => now()->year,
        'reporting_half' => 'H1',
    ])->assertStatus(302);
});

it('grants access to approve with correct permission and valid state', function () {
    Permission::create(['name' => 'naicom-reports.review', 'guard_name' => 'web']);
    Permission::create(['name' => 'naicom-reports.approve', 'guard_name' => 'web']);
    $this->user->givePermissionTo('naicom-reports.review', 'naicom-reports.approve');
    $this->actingAs($this->user);

    $this->run->update(['status' => ReportStatus::UnderReview]);

    $this->post(route('reports.naicom.approve', ['reportRun' => $this->run]))
        ->assertStatus(302);
});

it('grants access to lock with correct permission and valid state', function () {
    Permission::create(['name' => 'naicom-reports.approve', 'guard_name' => 'web']);
    Permission::create(['name' => 'naicom-reports.lock', 'guard_name' => 'web']);
    $this->user->givePermissionTo('naicom-reports.approve', 'naicom-reports.lock');
    $this->actingAs($this->user);

    $this->run->update(['status' => ReportStatus::Approved]);

    $this->post(route('reports.naicom.lock', ['reportRun' => $this->run]))
        ->assertStatus(302);
});
