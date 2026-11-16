<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Material recovered from a returned composition sale line.
 *
 * Rows are declared when the return is created and only become "restored"
 * (with an inventory transaction) when the return completes. The row keeps the
 * immutable run-item cost snapshot so historical profitability is never
 * recalculated from current component costs.
 */
class ReturnComponentRecovery extends Model
{
    protected $fillable = [
        'return_id',
        'return_item_id',
        'composition_run_id',
        'composition_run_item_id',
        'component_product_id',
        'component_name',
        'unit',
        'basis_quantity',
        'eligible_quantity',
        'recovered_quantity',
        'unit_cost',
        'total_cost',
        'inventory_transaction_id',
        'restored_at',
        'created_by',
    ];

    protected $casts = [
        'basis_quantity' => 'float',
        'eligible_quantity' => 'float',
        'recovered_quantity' => 'float',
        'unit_cost' => 'float',
        'total_cost' => 'float',
        'restored_at' => 'datetime',
    ];

    public function return(): BelongsTo
    {
        return $this->belongsTo(ReturnModel::class, 'return_id');
    }

    public function returnItem(): BelongsTo
    {
        return $this->belongsTo(ReturnItem::class, 'return_item_id');
    }

    public function compositionRun(): BelongsTo
    {
        return $this->belongsTo(CompositionRun::class, 'composition_run_id');
    }

    public function compositionRunItem(): BelongsTo
    {
        return $this->belongsTo(CompositionRunItem::class, 'composition_run_item_id');
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'component_product_id')
            ->withTrashed()
            ->withoutGlobalScope('notArchived');
    }

    public function inventoryTransaction(): BelongsTo
    {
        return $this->belongsTo(InventoryTransaction::class);
    }
}
