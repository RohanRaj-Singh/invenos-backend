<?php

namespace App\Contracts\Lifecycle;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

interface Unarchivable
{
    public function canUnarchive(Model $record): void;
    public function executeUnarchive(Model $record, User $user): void;
}
