<?php

use App\Providers\AppServiceProvider;
use App\Providers\LifecycleServiceProvider;

return [
    AppServiceProvider::class,
    LifecycleServiceProvider::class,
    TransactionServiceProvider::class,
];
