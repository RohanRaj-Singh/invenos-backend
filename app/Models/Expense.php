<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'expense_number', 'date', 'category_id', 'amount', 'paid_to',
        'payment_method', 'notes', 'created_by',
    ];
    protected $casts = ['date' => 'date', 'amount' => 'float'];
    public function category() { return $this->belongsTo(ExpenseCategory::class); }
}
