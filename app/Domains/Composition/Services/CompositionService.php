<?php

namespace App\Domains\Composition\Services;

use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Models\Product;
use App\Models\ProductComposition;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompositionService
{
    public function __construct(
        private readonly CompositionValidator $validator,
    ) {}

    public function getActive(int $productId, string $kind): ?ProductComposition
    {
        return ProductComposition::query()
            ->where('product_id', $productId)
            ->where('kind', $kind)
            ->where('is_active', true)
            ->with('items.component')
            ->orderByDesc('version')
            ->first();
    }

    public function getForProduct(int $productId): Collection
    {
        return ProductComposition::query()
            ->where('product_id', $productId)
            ->where('is_active', true)
            ->with('items.component')
            ->orderBy('kind')
            ->get();
    }

    public function find(int $id): ProductComposition
    {
        return ProductComposition::with('items.component')->findOrFail($id);
    }

    public function save(SaveCompositionData $data, ?string $createdBy = null): ProductComposition
    {
        $active = ProductComposition::query()
            ->where('product_id', $data->productId)
            ->where('kind', $data->kind)
            ->where('is_active', true)
            ->first();

        $this->validator->validate($data, $active?->id);

        return DB::transaction(function () use ($data, $createdBy): ProductComposition {
            $product = Product::withArchived()->withTrashed()->lockForUpdate()->findOrFail($data->productId);

            if ($product->archived_at !== null || $product->trashed()) {
                throw ValidationException::withMessages([
                    'product_id' => 'The composition product must exist and be active.',
                ]);
            }

            $maxVersion = (int) ProductComposition::query()
                ->where('product_id', $data->productId)
                ->where('kind', $data->kind)
                ->max('version');

            ProductComposition::query()
                ->where('product_id', $data->productId)
                ->where('kind', $data->kind)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $composition = ProductComposition::create([
                'product_id' => $data->productId,
                'kind' => $data->kind,
                'version' => $maxVersion + 1,
                'name' => $data->name,
                'output_quantity' => $data->outputQuantity,
                'output_unit_id' => $data->outputUnitId ?: $product->base_unit_id,
                'is_active' => true,
                'notes' => $data->notes,
                'created_by' => $createdBy,
            ]);

            foreach ($data->items as $index => $item) {
                $composition->items()->create([
                    'component_product_id' => $item->componentProductId,
                    'quantity_base' => $item->quantityBase,
                    'display_unit_id' => $item->displayUnitId,
                    'wastage_pct' => $item->wastagePct,
                    'is_optional' => $item->isOptional,
                    'sort_order' => $item->sortOrder ?? $index,
                ]);
            }

            return $composition->load('items.component');
        });
    }

    public function update(ProductComposition $composition, SaveCompositionData $data, ?string $createdBy = null): ProductComposition
    {
        if ($composition->product_id !== $data->productId || $composition->kind !== $data->kind) {
            throw ValidationException::withMessages([
                'composition' => 'The composition product and kind cannot be changed.',
            ]);
        }

        return $this->save($data, $createdBy ?? $composition->created_by);
    }

    public function deactivate(int $id): ProductComposition
    {
        return DB::transaction(function () use ($id): ProductComposition {
            $composition = ProductComposition::lockForUpdate()->findOrFail($id);

            if ($composition->is_active) {
                $composition->is_active = false;
                $composition->save();
            }

            return $composition;
        });
    }
}
