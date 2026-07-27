<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SellingUnit extends Model
{
    protected $fillable = ['product_id', 'name', 'unit_id', 'quantity', 'sale_price', 'barcode', 'sku', 'is_default'];
    protected $casts = ['quantity' => 'float', 'sale_price' => 'float', 'is_default' => 'boolean'];
    public function product() { return $this->belongsTo(Product::class); }
}
