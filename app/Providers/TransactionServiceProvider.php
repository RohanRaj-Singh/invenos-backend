<?php

namespace App\Providers;

use App\Domains\Transactions\Services\TransactionEngine;
use App\Domains\Transactions\Types\ReturnType;
use App\Domains\Transactions\Types\SaleType;
use Illuminate\Support\ServiceProvider;

class TransactionServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TransactionEngine::class, function ($app) {
            $engine = new TransactionEngine(
                $app->make(\App\Domains\Inventory\Services\InventoryService::class),
            );

            // Register transaction types
            $engine->registerType(new SaleType());
            $engine->registerType(new ReturnType());

            return $engine;
        });
    }

    public function boot(): void {}
}
