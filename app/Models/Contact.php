<?php

namespace App\Models;

use Database\Factories\ContactFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    /** @use HasFactory<ContactFactory> */
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'current_balance' => 0,
    ];

    protected $fillable = [
        'type', 'roles', 'name', 'company_name', 'contact_person',
        'phone', 'email', 'cnic', 'address', 'opening_balance',
        'balance_type', 'current_balance', 'notes', 'created_by',
    ];

    protected $casts = [
        'roles' => 'array',
        'opening_balance' => 'float',
        'current_balance' => 'float',
    ];

    public function scopeCustomers($query) { return $query->whereJsonContains('roles', 'customer'); }
    public function scopeSuppliers($query) { return $query->whereJsonContains('roles', 'supplier'); }
    public function scopePatients($query) { return $query->whereJsonContains('roles', 'patient'); }
    public function scopeByRole($query, string $role) { return $query->whereJsonContains('roles', $role); }

    public function sales() { return $this->hasMany(Sale::class, 'customer_id'); }
    public function purchases() { return $this->hasMany(PurchaseBill::class, 'supplier_id'); }
    public function financialTransactions() { return $this->hasMany(FinancialTransaction::class); }
}
