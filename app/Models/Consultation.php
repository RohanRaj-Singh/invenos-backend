<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Consultation extends Model
{
    protected $fillable = [
        'patient_id', 'doctor_id', 'visit_date', 'type', 'diagnosis',
        'notes', 'consultation_fee', 'status', 'sale_id', 'created_by',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'consultation_fee' => 'float',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }
}
