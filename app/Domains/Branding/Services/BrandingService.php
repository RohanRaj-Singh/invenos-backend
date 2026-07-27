<?php

namespace App\Domains\Branding\Services;

use App\Domains\Settings\Services\SettingService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class BrandingService
{
    public function __construct(
        private readonly SettingService $settingService,
    ) {}

    public function get(): array
    {
        $settings = $this->settingService->get();
        return $settings['business'] ?? $this->defaults();
    }

    public function update(array $data): array
    {
        $this->settingService->update(
            \App\Domains\Settings\DTOs\UpdateSettingsData::fromRequest([
                'business' => $data,
            ])
        );
        return $this->get();
    }

    public function uploadLogo(UploadedFile $file): string
    {
        $path = $file->store('logos', 'public');
        $url = Storage::url($path);

        $this->update(['business_logo' => $url]);

        return $url;
    }

    public function defaults(): array
    {
        return [
            'business_name' => 'Business Name',
            'address' => '',
            'phone' => '',
            'email' => '',
            'website' => '',
            'business_logo' => '',
            'tagline' => '',
            'tax_number' => '',
        ];
    }
}
