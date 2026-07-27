<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseCategory extends Model
{
    protected $fillable = ['name', 'description', 'color', 'icon', 'active'];
    protected $casts = ['active' => 'boolean'];
    public function expenses() { return $this->hasMany(Expense::class, 'category_id'); }
}
