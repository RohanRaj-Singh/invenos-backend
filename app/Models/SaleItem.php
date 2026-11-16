<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id', 'product_id', 'product_name', 'selling_unit_id',
        'packaging_name', 'packaging_quantity', 'base_unit_quantity', 'base_quantity',
        'unit_price', 'cost_price', 'cost_complete', 'uncosted_quantity',
        'total', 'discount_pct', 'category', 'restock',
    ];

    protected $casts = [
        'packaging_quantity' => 'float', 'base_unit_quantity' => 'float',
        'base_quantity' => 'float', 'unit_price' => 'float', 'cost_price' => 'float',
        'cost_complete' => 'boolean', 'uncosted_quantity' => 'float',
        'total' => 'float', 'discount_pct' => 'float', 'restock' => 'boolean',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function compositionRuns()
    {
        return $this->hasMany(CompositionRun::class, 'sale_item_id');
    }

    public function prescriptionItem()
    {
        return $this->hasOne(PrescriptionItem::class);
    }
}
