<?php

namespace Tests\Feature;

use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentToolkitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup plans
        SubscriptionPlan::create([
            'name' => 'Starter', 'slug' => 'starter', 'price' => 10, 'currency' => 'USD', 'billing_cycle' => 'monthly',
        ]);
        SubscriptionPlan::create([
            'name' => 'Professional', 'slug' => 'professional', 'price' => 50, 'currency' => 'USD', 'billing_cycle' => 'monthly',
        ]);
    }

    protected function createUserWithPlan($planSlug)
    {
        $tenant = Tenant::factory()->create(['subscription_plan_id' => SubscriptionPlan::where('slug', $planSlug)->first()->id]);
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        return $user;
    }

    public function test_document_toolkit_index_is_accessible()
    {
        $user = $this->createUserWithPlan('starter');

        $response = $this->actingAs($user)->get(route('document-toolkit.index'));

        $response->assertStatus(200);
    }

    public function test_starter_plan_can_access_optimizer_and_batch()
    {
        $user = $this->createUserWithPlan('starter');

        $this->actingAs($user)->get(route('document-toolkit.optimizer'))->assertStatus(200);
        $this->actingAs($user)->get(route('document-toolkit.batch-pdf'))->assertStatus(200);
    }
}
