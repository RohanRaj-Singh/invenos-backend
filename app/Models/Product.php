<?php

namespace App\Models;

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
        'last_purchase_cost', 'default_purchase_cost', 'allow_negative_stock',
        'status', 'supplier_name', 'location', 'created_by',
    ];

    protected $casts = [
        'stock_quantity' => 'float',
        'low_stock_threshold' => 'float',
        'track_inventory' => 'boolean',
        'default_purchase_cost' => 'float',
        'last_purchase_cost' => 'float',
        'allow_negative_stock' => 'boolean',
    ];

    public function category() { return $this->belongsTo(Category::class); }
    public function sellingUnits() { return $this->hasMany(SellingUnit::class); }
    public function packaging() { return $this->hasMany(ProductPackaging::class); }
    public function inventoryTransactions() { return $this->hasMany(InventoryTransaction::class); }
    public function deletedBy() { return $this->belongsTo(\App\Models\User::class, 'deleted_by'); }

    /**
     * Resolved display name for the base unit.
     * E.g. 'kg' → 'Kilogram (kg)', 'capsule' → 'Capsule'
     * Every frontend page should use this instead of resolving in JS.
     */
    public function getBaseUnitNameAttribute(): string
    {
        return app(\App\Domains\Products\Services\ProductUnitService::class)
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
