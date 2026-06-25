<?php

namespace Tests\Feature;

use App\Models\PolicyType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PolicyTypeTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'email' => 'admin@mindintel.com',
        ]);

        $this->superAdmin->assignRole('super_admin');
    }

    public function test_can_view_policy_types_index(): void
    {
        PolicyType::factory()->count(3)->create();

        $response = $this->actingAs($this->superAdmin)
            ->get(route('admin.policy-types.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Admin/PolicyTypes/Index')
            ->has('policyTypes.data', 3)
        );
    }

    public function test_can_create_policy_type(): void
    {
        $policyTypeData = [
            'name' => 'Life Insurance',
            'code' => 'LIFE_INS',
            'description' => 'Life insurance policies',
            'is_active' => true,
            'base_premium' => 50000.00,
            'commission_rate' => 10.00,
            'sort_order' => 1,
        ];

        $response = $this->actingAs($this->superAdmin)
            ->post(route('admin.policy-types.store'), $policyTypeData);

        $response->assertRedirect(route('admin.policy-types.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('policy_types', [
            'name' => 'Life Insurance',
            'code' => 'LIFE_INS',
            'base_premium' => '50000.00',
            'commission_rate' => '10.00',
        ]);
    }

    public function test_can_update_policy_type(): void
    {
        $policyType = PolicyType::factory()->create([
            'name' => 'Auto Insurance',
            'code' => 'AUTO_INS',
        ]);

        $updateData = [
            'name' => 'Motor Insurance',
            'code' => 'MOTOR_INS',
            'description' => 'Updated motor insurance policies',
            'is_active' => true,
            'base_premium' => 75000.00,
            'commission_rate' => 15.00,
            'sort_order' => 2,
        ];

        $response = $this->actingAs($this->superAdmin)
            ->put(route('admin.policy-types.update', $policyType), $updateData);

        $response->assertRedirect(route('admin.policy-types.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('policy_types', [
            'id' => $policyType->id,
            'name' => 'Motor Insurance',
            'code' => 'MOTOR_INS',
            'base_premium' => '75000.00',
        ]);
    }

    public function test_can_delete_policy_type_without_relationships(): void
    {
        $policyType = PolicyType::factory()->create();

        $response = $this->actingAs($this->superAdmin)
            ->delete(route('admin.policy-types.destroy', $policyType));

        $response->assertRedirect(route('admin.policy-types.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('policy_types', [
            'id' => $policyType->id,
        ]);
    }

    public function test_can_toggle_policy_type_status(): void
    {
        $policyType = PolicyType::factory()->create(['is_active' => true]);

        $response = $this->actingAs($this->superAdmin)
            ->post(route('admin.policy-types.toggle-status', $policyType));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('policy_types', [
            'id' => $policyType->id,
            'is_active' => false,
        ]);
    }

    public function test_validates_required_fields(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->post(route('admin.policy-types.store'), []);

        $response->assertSessionHasErrors(['name', 'code']);
    }

    public function test_validates_unique_code(): void
    {
        PolicyType::factory()->create(['code' => 'EXISTING_CODE']);

        $response = $this->actingAs($this->superAdmin)
            ->post(route('admin.policy-types.store'), [
                'name' => 'Test Policy',
                'code' => 'EXISTING_CODE',
            ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_non_super_admin_cannot_access(): void
    {
        $regularUser = User::factory()->create();

        $response = $this->actingAs($regularUser)
            ->get(route('admin.policy-types.index'));

        $response->assertStatus(403);
    }
}
