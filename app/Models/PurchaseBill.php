<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseBill extends Model
{
    protected $fillable = [
        'invoice_ref', 'supplier_id', 'supplier_name', 'date',
        'subtotal', 'discount', 'total_amount', 'amount_paid', 'outstanding_balance',
        'payment_status', 'status', 'notes', 'created_by',
    ];
    protected $casts = [
        'date' => 'date',
        'subtotal' => 'float', 'discount' => 'float', 'total_amount' => 'float',
        'amount_paid' => 'float', 'outstanding_balance' => 'float',
    ];
    public function supplier() { return $this->belongsTo(Contact::class, 'supplier_id'); }
    public function items() { return $this->hasMany(PurchaseBillItem::class); }
}
