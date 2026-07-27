<?php

namespace App\Http\Controllers;

use App\Domains\Branding\Services\BrandingService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BrandingController extends Controller
{
    public function __construct(
        private readonly BrandingService $brandingService,
    ) {}

    public function edit(): Response
    {
        return Inertia::render('settings/Business', [
            'branding' => $this->brandingService->get(),
        ]);
    }

    public function update(): RedirectResponse
    {
        $data = request()->validate([
            'business_name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'tagline' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:100',
        ]);

        $this->brandingService->update($data);

        return back()->with('success', 'Branding updated successfully.');
    }

    public function uploadLogo(): RedirectResponse
    {
        request()->validate([
            'logo' => 'required|image|mimes:jpeg,png,webp|max:2048',
        ]);

        $url = $this->brandingService->uploadLogo(request()->file('logo'));

        return back()->with('success', 'Logo uploaded successfully.');
    }
}
