<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    protected $fillable = [
        'consultation_id', 'patient_id', 'notes', 'refillable',
        'prescribed_by', 'date',
    ];

    protected $casts = [
        'refillable' => 'boolean',
        'date' => 'date',
    ];

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'patient_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(PrescriptionImage::class);
    }
}
