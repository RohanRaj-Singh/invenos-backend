<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'sku', 'barcode', 'category_id', 'description', 'product_type',
        'base_unit_id', 'track_inventory', 'stock_quantity', 'low_stock_threshold',
        'status', 'supplier_name', 'location', 'created_by',
    ];

    protected $casts = [
        'stock_quantity' => 'float',
        'low_stock_threshold' => 'float',
        'track_inventory' => 'boolean',
    ];

    public function category() { return $this->belongsTo(Category::class); }
    public function sellingUnits() { return $this->hasMany(SellingUnit::class); }
    public function inventoryTransactions() { return $this->hasMany(InventoryTransaction::class); }
}
