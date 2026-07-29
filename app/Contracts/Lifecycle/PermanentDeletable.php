<?php

namespace App\Contracts\Lifecycle;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

interface PermanentDeletable
{
    public function canPermanentDelete(Model $record): void;
}
