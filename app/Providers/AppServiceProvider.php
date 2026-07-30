<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // ─── Lifecycle Permission Gates ─────────────────────────
        // Managers+ can delete/restore; only Admin can permanently delete.

        Gate::define('lifecycle.delete-sales', fn (User $user) => $user->isAdmin());
        Gate::define('lifecycle.restore-sales', fn (User $user) => $user->isAdmin());

        Gate::define('lifecycle.delete-purchases', fn (User $user) => $user->isAdmin());
        Gate::define('lifecycle.restore-purchases', fn (User $user) => $user->isAdmin());

        Gate::define('lifecycle.delete-products', fn (User $user) => $user->isAdmin());
        Gate::define('lifecycle.archive-products', fn (User $user) => $user->isAdmin());
        Gate::define('lifecycle.archive-contacts', fn (User $user) => $user->isAdmin());

        Gate::define('lifecycle.view-recycle-bin', fn (User $user) => $user->isAdmin());
        Gate::define('lifecycle.restore-recycle-bin', fn (User $user) => $user->isAdmin());
        Gate::define('lifecycle.permanent-delete', fn (User $user) => $user->isAdmin());
    }
}
