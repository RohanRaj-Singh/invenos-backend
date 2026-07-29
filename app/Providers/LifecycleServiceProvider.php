<?php

namespace App\Providers;

use App\Models\Contact;
use App\Models\Product;
use App\Models\Sale;
use App\Policies\Lifecycle\ContactPolicy;
use App\Policies\Lifecycle\ProductPolicy;
use App\Policies\Lifecycle\SalePolicy;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Support\ServiceProvider;

class LifecycleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(RecordLifecycleService::class, function ($app) {
            return new RecordLifecycleService($app->make(\App\Services\Lifecycle\AuditService::class));
        });
    }

    public function boot(): void
    {
        $lifecycle = $this->app->make(RecordLifecycleService::class);

        $lifecycle->register(Product::class, ProductPolicy::class);
        $lifecycle->register(Contact::class, ContactPolicy::class);
        $lifecycle->register(Sale::class, SalePolicy::class);
    }
}
