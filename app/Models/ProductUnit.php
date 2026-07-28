<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductUnit extends Model
{
    protected $fillable = ['name'];

    public function packagingAsContainer()
    {
        return $this->hasMany(ProductPackaging::class, 'container_unit_id');
    }

    public function packagingAsContains()
    {
        return $this->hasMany(ProductPackaging::class, 'contains_unit_id');
    }
}
