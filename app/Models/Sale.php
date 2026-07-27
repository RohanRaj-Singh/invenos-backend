<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'invoice_number', 'source', 'date', 'customer_id', 'customer_name',
        'subtotal', 'discount', 'grand_total', 'amount_paid',
        'outstanding_balance', 'payment_status', 'notes', 'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'subtotal' => 'float', 'discount' => 'float', 'grand_total' => 'float',
        'amount_paid' => 'float', 'outstanding_balance' => 'float',
    ];

    public function customer() { return $this->belongsTo(Contact::class, 'customer_id'); }
    public function items() { return $this->hasMany(SaleItem::class); }
    public function financialTransactions() { return $this->hasMany(FinancialTransaction::class, 'linked_sale_id'); }
}
