<?php

namespace App\Contracts\Lifecycle;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

interface Deletable
{
    public function canDelete(Model $record): void;
    public function previewImpact(Model $record): array;
    public function executeDelete(Model $record, User $user): void;
}
