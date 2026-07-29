<?php

namespace App\Contracts\Lifecycle;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

interface Restorable
{
    public function canRestore(Model $record): void;
    public function executeRestore(Model $record, User $user): void;
}
