<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductComposition extends Model
{
    public const KIND_ASSEMBLY = 'assembly';

    public const KIND_CONSUMPTION = 'consumption';

    public const KINDS = [
        self::KIND_ASSEMBLY,
        self::KIND_CONSUMPTION,
    ];

    protected $fillable = [
        'product_id',
        'kind',
        'version',
        'name',
        'output_quantity',
        'output_unit_id',
        'is_active',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'version' => 'integer',
        'output_quantity' => 'float',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function items()
    {
        return $this->hasMany(ProductCompositionItem::class, 'composition_id');
    }

    public function runs()
    {
        return $this->hasMany(CompositionRun::class, 'composition_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfKind($query, string $kind)
    {
        return $query->where('kind', $kind);
    }

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }
}
