<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseBillItem extends Model
{
    protected $fillable = [
        'purchase_bill_id', 'product_id', 'product_name', 'base_unit_id',
        'base_unit_name', 'purchase_pack_name', 'purchase_pack_qty',
        'purchase_quantity', 'unit_cost', 'total_cost', 'discount_pct',
    ];
    protected $casts = [
        'purchase_pack_qty' => 'float', 'purchase_quantity' => 'float',
        'unit_cost' => 'float', 'total_cost' => 'float', 'discount_pct' => 'float',
    ];
    public function purchaseBill() { return $this->belongsTo(PurchaseBill::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
