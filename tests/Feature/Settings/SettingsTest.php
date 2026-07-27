<?php

namespace Tests\Feature\Settings;

use App\Domains\Settings\DTOs\UpdateSettingsData;
use App\Domains\Settings\Services\SettingService;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private SettingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(SettingService::class);
    }

    public function test_defaults_returned_when_no_db_row(): void
    {
        $settings = $this->service->get();
        $this->assertEquals('Invenos', $settings['business']['business_name']);
        $this->assertEquals('PKR', $settings['business']['currency']);
    }

    public function test_can_update_business_settings(): void
    {
        $data = UpdateSettingsData::fromRequest([
            'business' => ['business_name' => 'Test Clinic', 'currency' => 'USD'],
        ]);

        $result = $this->service->update($data);

        $this->assertEquals('Test Clinic', $result['business']['business_name']);
        $this->assertEquals('USD', $result['business']['currency']);
        $this->assertDatabaseHas('settings', ['id' => 1]);
    }

    public function test_partial_update_merges_with_existing(): void
    {
        Setting::create(['values' => $this->service->defaults()]);

        $this->service->update(UpdateSettingsData::fromRequest([
            'business' => ['business_name' => 'Clinic One'],
        ]));

        $result = $this->service->update(UpdateSettingsData::fromRequest([
            'business' => ['phone' => '+92 300 1111111'],
        ]));

        $this->assertEquals('Clinic One', $result['business']['business_name']);
        $this->assertEquals('+92 300 1111111', $result['business']['phone']);
    }

    public function test_can_update_pos_settings(): void
    {
        $result = $this->service->update(UpdateSettingsData::fromRequest([
            'pos' => ['receipt_size' => '58mm', 'default_payment_method' => 'easypaisa'],
        ]));

        $this->assertEquals('58mm', $result['pos']['receipt_size']);
        $this->assertEquals('easypaisa', $result['pos']['default_payment_method']);
    }

    public function test_can_reset_to_defaults(): void
    {
        $this->service->update(UpdateSettingsData::fromRequest([
            'business' => ['business_name' => 'Custom Name'],
        ]));

        $reset = $this->service->reset();
        $this->assertEquals('Invenos', $reset['business']['business_name']);
    }

    public function test_http_update_endpoint_works(): void
    {
        $response = $this->put('/settings', [
            'business' => ['business_name' => 'HTTP Update Test'],
        ]);

        $response->assertSessionHas('success');
        $response->assertRedirect();

        $settings = $this->service->get();
        $this->assertEquals('HTTP Update Test', $settings['business']['business_name']);
    }

    public function test_invalid_settings_rejected(): void
    {
        $response = $this->put('/settings', [
            'pos' => ['receipt_size' => 'invalid-size'],
        ]);

        $response->assertSessionHasErrors('pos.receipt_size');
    }
}
