<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ReturnItem extends Model
{
    protected $fillable = [
        'return_id',
        'reference_item_type', 'reference_item_id',
        'product_id', 'product_name', 'selling_unit_id', 'packaging_name',
        'quantity', 'base_quantity', 'unit_price', 'total',
        'reason_id', 'notes',
    ];

    protected $casts = [
        'quantity' => 'float',
        'base_quantity' => 'float',
        'unit_price' => 'float',
        'total' => 'float',
    ];

    /**
     * The parent return document.
     */
    public function return(): BelongsTo
    {
        return $this->belongsTo(ReturnModel::class, 'return_id');
    }

    /**
     * The original line item this return item references (SaleItem or PurchaseBillItem).
     */
    public function referenceItem(): MorphTo
    {
        return $this->morphTo('reference_item');
    }

    /**
     * The product being returned.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * The reason for this line item's return.
     */
    public function reason(): BelongsTo
    {
        return $this->belongsTo(ReturnReason::class);
    }
}
