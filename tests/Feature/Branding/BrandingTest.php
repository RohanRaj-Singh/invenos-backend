<?php

namespace Tests\Feature\Branding;

use App\Domains\Branding\Services\BrandingService;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandingTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_branding_returns_defaults_when_no_settings(): void
    {
        $branding = app(BrandingService::class)->get();
        $this->assertArrayHasKey('business_name', $branding);
        $this->assertArrayHasKey('address', $branding);
        $this->assertArrayHasKey('phone', $branding);
        $this->assertArrayHasKey('email', $branding);
    }

    public function test_can_update_branding(): void
    {
        app(BrandingService::class)->update([
            'business_name' => 'My Clinic',
            'phone' => '+92 300 1234567',
        ]);

        $branding = app(BrandingService::class)->get();
        $this->assertEquals('My Clinic', $branding['business_name']);
        $this->assertEquals('+92 300 1234567', $branding['phone']);
    }

    public function test_http_update_endpoint(): void
    {
        Setting::create(['values' => ['business' => ['business_name' => 'Old Name', 'address' => '', 'phone' => '', 'email' => '', 'website' => '', 'business_logo' => '']]]);

        $response = $this->actingAs($this->admin())->put('/settings', [
            'business' => ['business_name' => 'Updated Clinic'],
        ]);

        $response->assertSessionHas('success');
        $branding = app(BrandingService::class)->get();
        $this->assertEquals('Updated Clinic', $branding['business_name']);
    }

    public function test_business_settings_reject_an_invalid_email(): void
    {
        $response = $this->actingAs($this->admin())->put('/settings', [
            'business' => ['email' => 'not-an-email'],
        ]);
        $response->assertSessionHasErrors('business.email');
    }
}
