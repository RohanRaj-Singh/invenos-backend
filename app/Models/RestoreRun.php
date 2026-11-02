<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RestoreRun extends Model
{
    use HasFactory;

    public const STATUS_VALIDATING = 'validating';
    public const STATUS_READY = 'ready';
    public const STATUS_RUNNING = 'running';
    public const STATUS_VERIFYING = 'verifying';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'uuid',
        'backup_id',
        'source',
        'status',
        'artifact_path',
        'artifact_name',
        'size_bytes',
        'password_protected',
        'preview',
        'safety_backup_id',
        'confirmation_phrase',
        'started_by',
        'started_at',
        'completed_at',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'password_protected' => 'boolean',
            'preview' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function backup()
    {
        return $this->belongsTo(Backup::class);
    }

    public function safetyBackup()
    {
        return $this->belongsTo(Backup::class, 'safety_backup_id');
    }
}
