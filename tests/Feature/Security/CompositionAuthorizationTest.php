<?php

namespace Tests\Feature\Security;

use App\Models\ProductComposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class CompositionAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'admin', bool $active = true): User
    {
        return User::factory()->create(['role' => $role, 'active' => $active]);
    }

    public function test_admin_can_view_and_manage_compositions(): void
    {
        $admin = $this->user('admin');

        $this->assertTrue(Gate::forUser($admin)->allows('view', ProductComposition::class));
        $this->assertTrue(Gate::forUser($admin)->allows('manage', ProductComposition::class));
    }

    public function test_salesman_can_view_but_cannot_manage_compositions(): void
    {
        $salesman = $this->user('salesman');

        $this->assertTrue(Gate::forUser($salesman)->allows('view', ProductComposition::class));
        $this->assertFalse(Gate::forUser($salesman)->allows('manage', ProductComposition::class));
    }

    public function test_inactive_admin_cannot_manage_compositions(): void
    {
        $admin = $this->user('admin', false);

        $this->assertFalse(Gate::forUser($admin)->allows('view', ProductComposition::class));
        $this->assertFalse(Gate::forUser($admin)->allows('manage', ProductComposition::class));
    }
}
