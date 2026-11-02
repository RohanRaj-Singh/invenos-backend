<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Backup extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_FAILED = 'failed';
    public const STATUS_EXPIRED = 'expired';

    public const KIND_MANUAL = 'manual';
    public const KIND_SCHEDULED = 'scheduled';
    public const KIND_SAFETY = 'safety';

    protected $fillable = [
        'uuid',
        'filename',
        'disk',
        'path',
        'size_bytes',
        'sha256',
        'status',
        'format_version',
        'app_version',
        'schema_version',
        'encrypted',
        'password_protected',
        'kind',
        'included_scope',
        'table_counts',
        'pending_jobs',
        'created_by',
        'started_at',
        'completed_at',
        'verified_at',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'format_version' => 'integer',
            'schema_version' => 'integer',
            'encrypted' => 'boolean',
            'password_protected' => 'boolean',
            'included_scope' => 'array',
            'table_counts' => 'array',
            'pending_jobs' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function isDownloadable(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_VERIFIED], true);
    }

    public function isVerified(): bool
    {
        return $this->status === self::STATUS_VERIFIED;
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', [self::STATUS_COMPLETED, self::STATUS_VERIFIED]);
    }
}
