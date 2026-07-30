<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionImage extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    protected $fillable = [
        'prescription_id', 'image_path', 'original_name',
        'mime_type', 'size', 'is_primary', 'uploaded_by',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'size' => 'integer',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}