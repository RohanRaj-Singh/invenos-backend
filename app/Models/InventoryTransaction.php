<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'product_id', 'type', 'quantity', 'unit_cost', 'unit', 'packaging_name',
        'packaging_quantity', 'date', 'document_date', 'reference', 'notes', 'user',
        'running_balance', 'reference_type', 'reference_id',
    ];
    protected $casts = [
        'date' => 'date', 'document_date' => 'date', 'quantity' => 'float',
        'unit_cost' => 'float', 'packaging_quantity' => 'float',
        'running_balance' => 'float',
    ];
    public function product() { return $this->belongsTo(Product::class); }
}
