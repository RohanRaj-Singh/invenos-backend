<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SellingUnit extends Model
{
    protected $fillable = [
        'product_id', 'name', 'unit_id', 'quantity', 'sale_price',
        'barcode', 'sku', 'is_default', 'packaging_id', 'product_unit_id',
    ];

    protected $casts = [
        'quantity' => 'float',
        'sale_price' => 'float',
        'is_default' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * If this selling unit was generated from a packaging level,
     * this references the product_packaging row that created it.
     * Null means this is a standalone/custom selling unit.
     */
    public function packaging()
    {
        return $this->belongsTo(ProductPackaging::class, 'packaging_id');
    }

    /**
     * Whether this selling unit was generated from packaging.
     * Equivalent to: packaging_id is not null.
     */
    public function isDerived(): bool
    {
        return $this->packaging_id !== null;
    }
}
