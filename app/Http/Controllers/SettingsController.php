<?php

namespace App\Http\Controllers;

use App\Domains\Settings\DTOs\UpdateSettingsData;
use App\Domains\Settings\Services\SettingService;
use App\Http\Requests\Settings\UpdateSettingsRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __construct(
        private readonly SettingService $settingService,
    ) {}

    public function index(): Response
    {
        $settings = $this->settingService->get();
        return Inertia::render('settings/Index', ['settings' => $settings]);
    }

    public function edit(string $group = 'business'): Response
    {
        $settings = $this->settingService->get();
        $allowed = ['business', 'pos', 'inventory', 'sales', 'purchases', 'receipt'];
        $group = in_array($group, $allowed) ? $group : 'business';

        return Inertia::render("settings/" . ucfirst($group), [
            'settings' => $settings,
            'group' => $group,
        ]);
    }

    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        $data = UpdateSettingsData::fromRequest($request->validated());
        $this->settingService->update($data);

        return back()->with('success', 'Settings saved successfully.');
    }
}
