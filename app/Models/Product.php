<?php

namespace App\Models;

use App\Domains\Products\Services\ProductUnitService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $attributes = [
        'stock_quantity' => 0,
        'status' => 'out-of-stock',
        'allow_negative_stock' => true,
    ];

    protected $fillable = [
        'name', 'sku', 'barcode', 'category_id', 'description', 'product_type',
        'base_unit_id', 'track_inventory', 'stock_quantity', 'low_stock_threshold',
        'last_purchase_cost', 'default_purchase_cost', 'opening_cost', 'average_cost', 'uncosted_qty',
        'allow_negative_stock',
        'status', 'supplier_name', 'location', 'created_by',
    ];

    protected $casts = [
        'stock_quantity' => 'float',
        'low_stock_threshold' => 'float',
        'track_inventory' => 'boolean',
        'default_purchase_cost' => 'float',
        'last_purchase_cost' => 'float',
        'opening_cost' => 'float',
        'average_cost' => 'float',
        'uncosted_qty' => 'float',
        'allow_negative_stock' => 'boolean',
        'archived_at' => 'datetime',
    ];

    /**
     * Archived products are hidden from every listing, picker, report, alert and
     * total — an archived product must never look available. Surfaces that
     * legitimately need them opt back in with withArchived(): the product's own
     * page (so it can be unarchived), returns of archived products, the Recycle
     * Bin, SKU generation, and the inventory "Archived" filter.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('notArchived', function (Builder $builder) {
            $builder->whereNull('products.archived_at');
        });
    }

    /** Include archived products in the query. */
    public function scopeWithArchived(Builder $query): Builder
    {
        return $query->withoutGlobalScope('notArchived');
    }

    /**
     * Products that hold no stock of their own: they have an active consumption
     * formula and no active assembly formula. These are service/formula records,
     * not physical inventory.
     */
    public function scopeFormulaOnly(Builder $query): Builder
    {
        return $query
            ->whereHas('compositions', fn (Builder $composition) => $composition
                ->where('kind', ProductComposition::KIND_CONSUMPTION)
                ->where('is_active', true))
            ->whereDoesntHave('compositions', fn (Builder $composition) => $composition
                ->where('kind', ProductComposition::KIND_ASSEMBLY)
                ->where('is_active', true));
    }

    /** Exclude formula-only records from a physical-inventory surface. */
    public function scopeExcludingFormulaOnly(Builder $query): Builder
    {
        return $query->whereNot(function (Builder $product) {
            $product->formulaOnly();
        });
    }

    public function isFormulaOnly(): bool
    {
        return $this->compositions()
            ->where('kind', ProductComposition::KIND_CONSUMPTION)
            ->where('is_active', true)
            ->exists()
            && ! $this->compositions()
                ->where('kind', ProductComposition::KIND_ASSEMBLY)
                ->where('is_active', true)
                ->exists();
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function sellingUnits()
    {
        return $this->hasMany(SellingUnit::class);
    }

    public function packaging()
    {
        return $this->hasMany(ProductPackaging::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    public function compositions()
    {
        return $this->hasMany(ProductComposition::class);
    }

    public function compositionItemsAsComponent()
    {
        return $this->hasMany(ProductCompositionItem::class, 'component_product_id');
    }

    public function compositionRuns()
    {
        return $this->hasMany(CompositionRun::class);
    }

    public function compositionRunItemsAsComponent()
    {
        return $this->hasMany(CompositionRunItem::class, 'component_product_id');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /**
     * Resolved display name for the base unit.
     * E.g. 'kg' → 'Kilogram (kg)', 'capsule' → 'Capsule'
     * Every frontend page should use this instead of resolving in JS.
     */
    public function getBaseUnitNameAttribute(): string
    {
        return app(ProductUnitService::class)
            ->resolveDisplayUnit($this->base_unit_id);
    }

    /**
     * Get derived selling units only (those generated from packaging).
     */
    public function derivedSellingUnits()
    {
        return $this->sellingUnits()->whereNotNull('packaging_id');
    }

    /**
     * Get custom selling units only (those NOT generated from packaging).
     */
    public function customSellingUnits()
    {
        return $this->sellingUnits()->whereNull('packaging_id');
    }
}
