<?php

use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\Tenant;

it('clones platform templates to a new tenant upon creation', function () {
    // Ensure we have some platform templates
    $type = PolicyType::factory()->create();
    $class = PolicyClass::factory()->create(['policy_type_id' => $type->id]);

    $template1 = PolicyProduct::factory()->create(['tenant_id' => null, 'name' => 'Template 1', 'policy_type_id' => $type->id, 'policy_class_id' => $class->id]);
    $template2 = PolicyProduct::factory()->create(['tenant_id' => null, 'name' => 'Template 2', 'policy_type_id' => $type->id, 'policy_class_id' => $class->id]);

    $templatesCount = PolicyProduct::whereNull('tenant_id')->count();
    expect($templatesCount)->toBeGreaterThanOrEqual(2);

    $tenant = Tenant::factory()->create();

    // Verify tenant got copies of the templates
    $tenantProductsCount = PolicyProduct::where('tenant_id', $tenant->id)->count();
    expect($tenantProductsCount)->toBe($templatesCount);

    $tenantProduct1 = PolicyProduct::where('tenant_id', $tenant->id)->where('name', 'Template 1')->first();
    expect($tenantProduct1)->not->toBeNull()
        ->and($tenantProduct1->code)->toBe($template1->code);
});
