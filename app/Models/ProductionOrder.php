<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionOrder extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REVERSED = 'reversed';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_IN_PROGRESS,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
        self::STATUS_REVERSED,
    ];

    protected $fillable = [
        'production_number',
        'product_id',
        'composition_id',
        'composition_version',
        'planned_quantity',
        'output_unit_id',
        'actual_output_quantity',
        'actual_output_base_quantity',
        'location',
        'status',
        'planned_date',
        'started_at',
        'completed_at',
        'reversed_at',
        'composition_run_id',
        'total_cost',
        'unit_cost',
        'cost_basis',
        'cost_complete',
        'finished_inventory_transaction_id',
        'reversal_inventory_transaction_id',
        'idempotency_key',
        'reversal_idempotency_key',
        'created_by',
        'completed_by',
        'reversed_by',
        'reference',
        'notes',
    ];

    protected $casts = [
        'composition_version' => 'integer',
        'planned_quantity' => 'float',
        'actual_output_quantity' => 'float',
        'actual_output_base_quantity' => 'float',
        'total_cost' => 'float',
        'unit_cost' => 'float',
        'cost_complete' => 'boolean',
        'planned_date' => 'date',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function composition()
    {
        return $this->belongsTo(ProductComposition::class, 'composition_id');
    }

    public function compositionRun()
    {
        return $this->belongsTo(CompositionRun::class, 'composition_run_id');
    }

    public function finishedInventoryTransaction()
    {
        return $this->belongsTo(InventoryTransaction::class, 'finished_inventory_transaction_id');
    }

    public function reversalInventoryTransaction()
    {
        return $this->belongsTo(InventoryTransaction::class, 'reversal_inventory_transaction_id');
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isReversed(): bool
    {
        return $this->status === self::STATUS_REVERSED;
    }
}
