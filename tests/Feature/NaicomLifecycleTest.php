<?php

use App\Models\NaicomAdjustment;
use App\Models\NaicomReportLine;
use App\Models\NaicomReportRun;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

    collect([
        'naicom-reports.view',
        'naicom-reports.generate',
        'naicom-reports.review',
        'naicom-reports.adjust',
        'naicom-reports.approve',
        'naicom-reports.lock',
        'naicom-reports.export',
        'naicom-reports.submit',
        'naicom-reports.restate',
    ])->each(fn ($name) => Permission::create(['name' => $name, 'guard_name' => 'web']));

    $this->user->givePermissionTo([
        'naicom-reports.view',
        'naicom-reports.generate',
        'naicom-reports.review',
        'naicom-reports.adjust',
        'naicom-reports.approve',
        'naicom-reports.lock',
        'naicom-reports.restate',
    ]);

    $this->actingAs($this->user);
});

it('creates a report run in generated status via factory', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    expect($run)->toBeInstanceOf(NaicomReportRun::class);
    expect($run->status->value)->toBe('generated');
    expect($run->tenant_id)->toBe($this->tenant->id);
});

it('submits a generated report for review', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $this->post(route('reports.naicom.submit-review', $run))
        ->assertSessionDoesntHaveErrors();

    $run->refresh();
    expect($run->status->value)->toBe('under_review');
});

it('approves a report under review', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'under_review',
    ]);

    $this->post(route('reports.naicom.approve', $run))
        ->assertSessionDoesntHaveErrors();

    $run->refresh();
    expect($run->status->value)->toBe('approved');
    expect($run->approved_by)->toBe($this->user->id);
    expect($run->approved_at)->not->toBeNull();
});

it('locks an approved report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'approved',
    ]);

    $this->post(route('reports.naicom.lock', $run))
        ->assertSessionDoesntHaveErrors();

    $run->refresh();
    expect($run->status->value)->toBe('locked');
    expect($run->locked_at)->not->toBeNull();
});

it('completes full lifecycle from generated to locked', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $this->post(route('reports.naicom.submit-review', $run));
    $run->refresh();
    expect($run->status->value)->toBe('under_review');

    $this->post(route('reports.naicom.approve', $run));
    $run->refresh();
    expect($run->status->value)->toBe('approved');

    $this->post(route('reports.naicom.lock', $run));
    $run->refresh();
    expect($run->status->value)->toBe('locked');
});

it('rejects submit for review on non-generated report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'approved',
    ]);

    $this->post(route('reports.naicom.submit-review', $run))
        ->assertStatus(422);
});

it('rejects approve on non-under-review report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $this->post(route('reports.naicom.approve', $run))
        ->assertStatus(422);
});

it('rejects lock on non-approved report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'under_review',
    ]);

    $this->post(route('reports.naicom.lock', $run))
        ->assertStatus(422);
});

it('creates an adjustment on a mutable report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $this->post(route('reports.naicom.adjustments.store', $run), [
        'form_type' => '7.2B',
        'field' => 'premium_amount',
        'adjusted_value' => 50000,
        'reason' => 'Correcting premium amount based on updated policy data.',
    ])->assertSessionDoesntHaveErrors();

    expect($run->adjustments()->count())->toBe(1);

    $adjustment = $run->adjustments()->first();
    expect((float) $adjustment->adjusted_value)->toBe(50000.0);
    expect($adjustment->status->value)->toBe('draft');
    expect($adjustment->created_by)->toBe($this->user->id);
});

it('validates adjustment reason minimum length', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $this->post(route('reports.naicom.adjustments.store', $run), [
        'form_type' => '7.2B',
        'adjusted_value' => 1000,
        'reason' => 'Too short',
    ])->assertSessionHasErrors('reason');
});

it('validates adjustment requires adjusted value', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $this->post(route('reports.naicom.adjustments.store', $run), [
        'form_type' => '7.2B',
        'reason' => 'Valid reason for the adjustment test.',
    ])->assertSessionHasErrors('adjusted_value');
});

it('prevents adjustment on locked report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'locked',
    ]);

    $this->post(route('reports.naicom.adjustments.store', $run), [
        'form_type' => '7.2B',
        'adjusted_value' => 50000,
        'reason' => 'This adjustment should be rejected because the report is locked.',
    ])->assertStatus(422);
});

it('prevents adjustment on approved report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'approved',
    ]);

    $this->post(route('reports.naicom.adjustments.store', $run), [
        'form_type' => '7.2B',
        'adjusted_value' => 50000,
        'reason' => 'This adjustment should be rejected because the report is approved.',
    ])->assertStatus(422);
});

it('restates a generated report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $line = NaicomReportLine::create([
        'report_run_id' => $run->id,
        'form_type' => '7.2B',
        'row_number' => 1,
        'month' => 1,
        'data' => ['premium' => 10000],
        'calculated_amount' => 10000,
    ]);

    $this->post(route('reports.naicom.restate', $run))
        ->assertRedirect();

    $run->refresh();
    expect($run->status->value)->toBe('restated');

    $newRun = NaicomReportRun::where('status', 'generated')
        ->where('id', '!=', $run->id)
        ->first();

    expect($newRun)->not->toBeNull();
    expect($newRun->lines()->count())->toBe(1);
    expect($newRun->metadata['restated_from_run_id'])->toBe($run->id);
});

it('prevents restating a locked report', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'locked',
    ]);

    $this->post(route('reports.naicom.restate', $run))
        ->assertStatus(422);
});

it('shows adjustments page', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $adjustment = NaicomAdjustment::factory()->create([
        'report_run_id' => $run->id,
        'form_type' => '7.2B',
        'adjusted_value' => 50000,
        'reason' => 'Adjustment for testing the adjustments page display.',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('reports.naicom.adjustments', $run))
        ->assertInertia(fn ($page) => $page
            ->component('reports/naicom/adjustments')
            ->where('run.id', $run->id)
            ->has('adjustments', 1)
            ->where('adjustments.0.id', $adjustment->id)
        );
});

it('updates report line data when adjustment references a line', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $line = NaicomReportLine::create([
        'report_run_id' => $run->id,
        'form_type' => '7.2B',
        'row_number' => 1,
        'month' => 1,
        'data' => ['premium_amount' => 10000],
        'calculated_amount' => 10000,
    ]);

    $this->post(route('reports.naicom.adjustments.store', $run), [
        'form_type' => '7.2B',
        'report_line_id' => $line->id,
        'field' => 'premium_amount',
        'calculated_value' => 10000,
        'adjusted_value' => 15000,
        'reason' => 'Adjusting premium amount based on updated figures.',
    ])->assertSessionDoesntHaveErrors();

    $line->refresh();
    expect((float) $line->adjusted_amount)->toBe(15000.0);
    expect($line->data['premium_amount'])->toBe(15000);
    expect($line->adjustment_id)->not->toBeNull();
});

it('prevents restating during generating status', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generating',
    ]);

    $this->post(route('reports.naicom.restate', $run))
        ->assertStatus(422);
});

it('allows viewing adjustments page with zero adjustments', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $this->get(route('reports.naicom.adjustments', $run))
        ->assertInertia(fn ($page) => $page
            ->component('reports/naicom/adjustments')
            ->where('run.id', $run->id)
            ->has('adjustments', 0)
        );
});
