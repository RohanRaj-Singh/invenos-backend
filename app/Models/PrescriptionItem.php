<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'prescription_id', 'sale_item_id',
        'dosage', 'frequency', 'duration', 'instructions', 'notes',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    /**
     * The sale line item this prescription instruction refers to.
     * The sale_item holds: product_id, selling_unit_id, quantity, price.
     */
    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }
}