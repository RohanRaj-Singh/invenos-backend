<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductCompositionItem extends Model
{
    protected $table = 'product_composition_items';

    protected $fillable = [
        'composition_id',
        'component_product_id',
        'quantity_base',
        'display_unit_id',
        'wastage_pct',
        'is_optional',
        'sort_order',
    ];

    protected $casts = [
        'quantity_base' => 'float',
        'wastage_pct' => 'float',
        'is_optional' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function composition()
    {
        return $this->belongsTo(ProductComposition::class, 'composition_id');
    }

    public function component()
    {
        return $this->belongsTo(Product::class, 'component_product_id')
            ->withTrashed()
            ->withoutGlobalScope('notArchived');
    }
}
