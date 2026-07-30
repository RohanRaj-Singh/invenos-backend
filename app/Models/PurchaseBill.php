<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseBill extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_ref', 'supplier_id', 'supplier_name', 'date',
        'subtotal', 'discount', 'total_amount', 'amount_paid', 'outstanding_balance',
        'return_total', 'return_status',
        'payment_status', 'status', 'notes', 'created_by',
        'delete_reason', 'deleted_by',
    ];
    protected $casts = [
        'date' => 'date',
        'subtotal' => 'float', 'discount' => 'float', 'total_amount' => 'float',
        'amount_paid' => 'float', 'outstanding_balance' => 'float',
        'return_total' => 'float',
    ];
    public function supplier() { return $this->belongsTo(Contact::class, 'supplier_id'); }
    public function items() { return $this->hasMany(PurchaseBillItem::class); }
    public function deletedBy() { return $this->belongsTo(User::class, 'deleted_by'); }

    /**
     * Returns referencing this purchase bill.
     */
    public function returns(): MorphMany
    {
        return $this->morphMany(ReturnModel::class, 'reference');
    }
}
