<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\PrescriptionImage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PrescriptionImageController extends Controller
{
    public function store(Request $request, int $prescriptionId): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp|max:10240',
            'is_primary' => 'boolean',
        ]);

        $prescription = Prescription::findOrFail($prescriptionId);

        $file = $request->file('image');
        $uuid = Str::uuid();
        $ext = $file->getClientOriginalExtension();
        $path = "{$prescription->consultation_id}/{$prescription->id}/{$uuid}.{$ext}";

        Storage::disk('prescriptions')->put($path, file_get_contents($file));

        $image = $prescription->images()->create([
            'image_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'is_primary' => $request->boolean('is_primary', false),
            'uploaded_by' => auth()->id(),
        ]);

        return response()->json([
            'id' => $image->id,
            'image_url' => Storage::disk('prescriptions')->url($path),
            'is_primary' => $image->is_primary,
        ], 201);
    }

    public function index(int $prescriptionId): JsonResponse
    {
        $prescription = Prescription::findOrFail($prescriptionId);
        $images = $prescription->images()->orderBy('is_primary', 'desc')->get()->map(fn ($img) => [
            'id' => $img->id,
            'image_url' => Storage::disk('prescriptions')->url($img->image_path),
            'original_name' => $img->original_name,
            'mime_type' => $img->mime_type,
            'size' => $img->size,
            'is_primary' => $img->is_primary,
        ]);

        return response()->json(['data' => $images]);
    }

    public function destroy(int $id): JsonResponse
    {
        $image = PrescriptionImage::findOrFail($id);
        Storage::disk('prescriptions')->delete($image->image_path);
        $image->delete();

        return response()->json(null, 204);
    }

    public function download(int $id)
    {
        $image = PrescriptionImage::findOrFail($id);
        return Storage::disk('prescriptions')->download($image->image_path, $image->original_name);
    }
}
