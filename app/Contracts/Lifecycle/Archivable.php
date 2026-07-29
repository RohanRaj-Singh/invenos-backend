<?php

namespace App\Contracts\Lifecycle;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

interface Archivable
{
    public function canArchive(Model $record): void;
    public function executeArchive(Model $record, User $user): void;
}
