<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialTransaction extends Model
{
    protected $fillable = [
        'contact_id', 'direction', 'type', 'date', 'amount', 'method',
        'reference', 'description', 'linked_sale_id', 'created_by',
    ];
    protected $casts = ['date' => 'date', 'amount' => 'float'];
    public function contact() { return $this->belongsTo(Contact::class); }
    public function sale() { return $this->belongsTo(Sale::class, 'linked_sale_id'); }
}
