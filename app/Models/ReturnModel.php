<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReturnModel extends Model
{
    use SoftDeletes;

    protected $table = 'returns';

    protected $fillable = [
        'return_number', 'type',
        'reference_type', 'reference_id',
        'contact_id', 'return_date', 'reason_id', 'reason_note',
        'status',
        'subtotal', 'discount', 'grand_total',
        'refund_amount', 'refund_method',
        'notes', 'created_by',
        'delete_reason', 'deleted_by',
    ];

    protected $casts = [
        'return_date' => 'date',
        'subtotal' => 'float',
        'discount' => 'float',
        'grand_total' => 'float',
        'refund_amount' => 'float',
    ];

    /**
     * The original document this return references (Sale or PurchaseBill).
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * The return line items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class);
    }

    /**
     * The contact (customer or supplier).
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * The return reason.
     */
    public function reason(): BelongsTo
    {
        return $this->belongsTo(ReturnReason::class);
    }

    /**
     * The user who deleted this record.
     */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /**
     * Scope: sale returns only.
     */
    public function scopeSaleReturns($query)
    {
        return $query->where('type', 'SALE');
    }

    /**
     * Scope: purchase returns only.
     */
    public function scopePurchaseReturns($query)
    {
        return $query->where('type', 'PURCHASE');
    }

    /**
     * Scope: returns for a specific original document.
     */
    public function scopeForReference($query, string $type, int $id)
    {
        return $query->where('reference_type', $type)->where('reference_id', $id);
    }

    /**
     * Scope: pending returns.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: completed returns.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Calculate the total quantity already returned for a given sale/purchase item.
     */
    public static function returnedQuantityForItem(string $referenceItemType, int $referenceItemId): float
    {
        return (float) self::where('status', 'completed')
            ->join('return_items', 'returns.id', '=', 'return_items.return_id')
            ->where('return_items.reference_item_type', $referenceItemType)
            ->where('return_items.reference_item_id', $referenceItemId)
            ->sum('return_items.quantity');
    }
}
