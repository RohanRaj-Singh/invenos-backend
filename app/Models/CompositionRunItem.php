<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompositionRunItem extends Model
{
    protected $table = 'composition_run_items';

    protected $fillable = [
        'composition_run_id',
        'component_product_id',
        'component_name',
        'component_sku',
        'unit',
        'display_unit_id',
        'display_quantity',
        'template_quantity',
        'actual_quantity',
        'wastage_pct',
        'is_optional',
        'unit_cost',
        'total_cost',
        'cost_basis',
        'source_breakdown',
        'inventory_transaction_id',
    ];

    protected $casts = [
        'template_quantity' => 'float',
        'actual_quantity' => 'float',
        'display_quantity' => 'float',
        'wastage_pct' => 'float',
        'is_optional' => 'boolean',
        'unit_cost' => 'float',
        'total_cost' => 'float',
        'source_breakdown' => 'array',
    ];

    public function run()
    {
        return $this->belongsTo(CompositionRun::class, 'composition_run_id');
    }

    public function component()
    {
        return $this->belongsTo(Product::class, 'component_product_id')
            ->withTrashed()
            ->withoutGlobalScope('notArchived');
    }

    public function inventoryTransaction()
    {
        return $this->belongsTo(InventoryTransaction::class);
    }
}
