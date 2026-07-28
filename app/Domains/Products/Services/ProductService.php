<?php

namespace App\Domains\Products\Services;

use App\Domains\Products\DTOs\CreateProductData;
use App\Models\Category;
use App\Models\Product;
use App\Models\SellingUnit;
use App\Models\InventoryTransaction;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductService
{
    public function search(string $query = '', ?int $categoryId = null, int $perPage = 25): LengthAwarePaginator
    {
        $q = Product::query();

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%")
                  ->orWhere('barcode', 'like', "%{$query}%");
            });
        }

        if ($categoryId) {
            $q->where('category_id', $categoryId);
        }

        return $q->with('category', 'sellingUnits')
                 ->orderBy('name')
                 ->paginate($perPage);
    }

    public function create(CreateProductData $data): Product
    {
        $product = Product::create($data->toArray());

        // Record opening stock as an inventory transaction if > 0
        if ($product->stock_quantity > 0) {
            InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'adjustment',
                'quantity' => $product->stock_quantity,
                'unit' => $product->base_unit_id,
                'date' => now()->format('Y-m-d'),
                'reference' => 'INITIAL',
                'notes' => 'Opening stock (initial)',
                'user' => $data->createdBy,
                'running_balance' => $product->stock_quantity,
                'reference_type' => 'product',
                'reference_id' => $product->id,
            ]);
        }

        // Update status based on opening stock
        if ($product->stock_quantity > 0) {
            $product->status = 'in-stock';
            $product->save();
        }

        // Create selling units
        foreach ($data->sellingUnits as $unit) {
            $product->sellingUnits()->create([
                'name' => $unit['name'],
                'unit_id' => $unit['unit_id'] ?? $data->baseUnitId,
                'quantity' => $unit['quantity'] ?? 1,
                'sale_price' => $unit['sale_price'] ?? 0,
                'is_default' => $unit['is_default'] ?? count($product->sellingUnits) === 0,
            ]);
        }

        // Ensure at least one default selling unit exists
        if ($product->sellingUnits()->count() === 0) {
            $product->sellingUnits()->create([
                'name' => 'Single',
                'unit_id' => $data->baseUnitId,
                'quantity' => 1,
                'sale_price' => 0,
                'is_default' => true,
            ]);
        }

        return $product->load('category', 'sellingUnits');
    }

    public function update(int $id, array $data): Product
    {
        $product = Product::findOrFail($id);
        $product->update($data);
        return $product->load('category', 'sellingUnits');
    }

    public function delete(int $id): ?bool
    {
        return Product::findOrFail($id)->delete();
    }

    public function restore(int $id): Product
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();
        return $product;
    }

    public function get(int $id): Product
    {
        return Product::with('category', 'sellingUnits')->findOrFail($id);
    }

    public function generateSku(string $name): string
    {
        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name), 0, 3));
        $count = Product::withTrashed()->where('sku', 'like', "{$prefix}-%")->count() + 1;
        $sku = "{$prefix}-" . str_pad((string) $count, 4, '0', STR_PAD_LEFT);

        if (Product::withTrashed()->where('sku', $sku)->exists()) {
            $sku = "{$prefix}-" . str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
        }

        return $sku;
    }

    public function allCategories(): array
    {
        return Category::orderBy('name')->get()->toArray();
    }
}
