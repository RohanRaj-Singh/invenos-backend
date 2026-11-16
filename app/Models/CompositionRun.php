<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompositionRun extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_REVERSED = 'reversed';

    protected $fillable = [
        'run_number',
        'idempotency_key',
        'composition_id',
        'product_id',
        'kind',
        'output_unit_id',
        'source_type',
        'source_id',
        'sale_item_id',
        'reference',
        'template_version',
        'template_snapshot',
        'quantity',
        'output_quantity',
        'total_cost',
        'unit_cost',
        'cost_basis',
        'status',
        'effects_applied_at',
        'created_by',
        'location',
    ];

    protected $casts = [
        'sale_item_id' => 'integer',
        'template_version' => 'integer',
        'template_snapshot' => 'array',
        'quantity' => 'float',
        'output_quantity' => 'float',
        'total_cost' => 'float',
        'unit_cost' => 'float',
        'effects_applied_at' => 'datetime',
    ];

    public function composition()
    {
        return $this->belongsTo(ProductComposition::class, 'composition_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function items()
    {
        return $this->hasMany(CompositionRunItem::class, 'composition_run_id');
    }

    public function saleItem()
    {
        return $this->belongsTo(SaleItem::class, 'sale_item_id');
    }
}
