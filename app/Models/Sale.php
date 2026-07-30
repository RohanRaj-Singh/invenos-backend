<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_number', 'source', 'date', 'customer_id', 'customer_name',
        'subtotal', 'discount', 'grand_total', 'amount_paid',
        'outstanding_balance', 'return_total', 'return_status',
        'payment_status', 'notes', 'created_by',
        'delete_reason', 'deleted_by',
    ];

    protected $casts = [
        'date' => 'date',
        'subtotal' => 'float', 'discount' => 'float', 'grand_total' => 'float',
        'amount_paid' => 'float', 'outstanding_balance' => 'float',
        'return_total' => 'float',
    ];

    public function customer() { return $this->belongsTo(Contact::class, 'customer_id'); }
    public function items() { return $this->hasMany(SaleItem::class); }
    public function financialTransactions() { return $this->hasMany(FinancialTransaction::class, 'linked_sale_id'); }
    public function deletedBy() { return $this->belongsTo(User::class, 'deleted_by'); }

    /**
     * Returns referencing this sale.
     */
    public function returns(): MorphMany
    {
        return $this->morphMany(ReturnModel::class, 'reference');
    }
}
