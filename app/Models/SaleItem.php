<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id', 'product_id', 'product_name', 'selling_unit_id',
        'packaging_name', 'packaging_quantity', 'base_unit_quantity', 'base_quantity',
        'unit_price', 'cost_price', 'total', 'discount_pct', 'category', 'restock',
    ];
    protected $casts = [
        'packaging_quantity' => 'float', 'base_unit_quantity' => 'float',
        'base_quantity' => 'float', 'unit_price' => 'float', 'total' => 'float',
        'discount_pct' => 'float', 'restock' => 'boolean',
    ];
    public function sale() { return $this->belongsTo(Sale::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
