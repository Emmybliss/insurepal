<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create([
        'status' => 'active',
        'onboarding_completed' => true,
    ]);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    Permission::findOrCreate('view_document_templates', 'web');
    Permission::findOrCreate('edit_document_templates', 'web');

    $this->user->givePermissionTo(['view_document_templates', 'edit_document_templates']);
});

it('lists templates via index route', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('templates.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('DocumentTemplates/Index')
        ->has('templates')
        ->has('documentTypes')
    );
});

it('shows a valid template', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('templates.show', 'invoice.classic'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('DocumentTemplates/Show')
        ->where('template.key', 'invoice.classic')
        ->has('placeholders')
        ->has('sampleData')
    );
});

it('returns 404 for invalid template key', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('templates.show', 'nonexistent.key'));

    $response->assertNotFound();
});

it('resolves template keys with normalized matching', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('templates.show', 'invoiceclassic'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->where('template.key', 'invoice.classic'));
});

it('stores TenantTemplateOverride on update', function () {
    $this->actingAs($this->user);

    $response = $this->put(route('templates.update', 'invoice.classic'), [
        'label_overrides' => json_encode(['title_label' => 'Custom Invoice']),
        'color_overrides' => json_encode(['primary' => '#ff0000']),
    ]);

    $response->assertSessionHas('success');

    $this->assertDatabaseHas('tenant_template_overrides', [
        'tenant_id' => $this->tenant->id,
        'template_key' => 'invoice.classic',
    ]);
});

it('returns 404 updating nonexistent template', function () {
    $this->actingAs($this->user);

    $response = $this->put(route('templates.update', 'bad.key'), []);

    $response->assertNotFound();
});

it('returns placeholders for a valid template', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('templates.placeholders', 'invoice.classic'));

    $response->assertOk();
    $response->assertJsonStructure([
        'placeholders',
        'customizable_properties',
        'editable_labels',
    ]);
});

it('returns 404 for placeholders on invalid key', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('templates.placeholders', 'bad.key'));

    $response->assertNotFound();
});

it('stores element toggles on update', function () {
    $this->actingAs($this->user);

    $toggles = [
        'header' => true,
        'footer' => false,
        'prepared_by' => true,
        'authorized_signature' => false,
        'stamp' => true,
    ];

    $response = $this->put(route('templates.update', 'invoice.classic'), [
        'element_toggles' => json_encode($toggles),
    ]);

    $response->assertSessionHas('success');

    $this->assertDatabaseHas('tenant_template_overrides', [
        'tenant_id' => $this->tenant->id,
        'template_key' => 'invoice.classic',
    ]);

    $override = \App\Models\TenantTemplateOverride::where('tenant_id', $this->tenant->id)
        ->where('template_key', 'invoice.classic')
        ->first();

    expect($override->element_toggles)->toBe($toggles);
});
