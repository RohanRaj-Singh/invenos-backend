<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialTransaction extends Model
{
    protected $fillable = [
        'contact_id', 'direction', 'type', 'date', 'amount', 'method',
        'reference', 'description', 'linked_sale_id', 'linked_purchase_id',
        'linked_return_id', 'source_type', 'source_id', 'event_key',
        'reversal_of_id', 'reversed_at', 'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'float',
        'reversed_at' => 'datetime',
    ];

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'linked_sale_id');
    }

    public function purchase()
    {
        return $this->belongsTo(PurchaseBill::class, 'linked_purchase_id');
    }

    public function returnDocument()
    {
        return $this->belongsTo(ReturnModel::class, 'linked_return_id');
    }

    public function reversalOf()
    {
        return $this->belongsTo(self::class, 'reversal_of_id');
    }

    public function isCashMovement(): bool
    {
        return \App\Domains\Ledger\CashLedgerService::isCashType($this->type);
    }
}
