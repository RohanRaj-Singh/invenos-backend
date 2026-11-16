<?php

namespace App\Providers;

use App\Models\ProductComposition;
use App\Models\PurchaseBill;
use App\Models\Sale;
use App\Models\User;
use App\Policies\ProductCompositionPolicy;
use Illuminate\Database\Eloquent\Relations\Relation;
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
        // Return documents store lowercase reference types ('sale',
        // 'purchase_bill'), so the morph map must resolve them to models.
        Relation::morphMap([
            'sale' => Sale::class,
            'sale_bill' => Sale::class,
            'purchase' => PurchaseBill::class,
            'purchase_bill' => PurchaseBill::class,
        ]);

        Vite::prefetch(concurrency: 3);

        Gate::policy(ProductComposition::class, ProductCompositionPolicy::class);

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

        // ─── Write Authorization Gates ──────────────────────────
        Gate::define('products.create', fn (User $user) => $this->allows($user, 'products.create', ['admin']));
        Gate::define('products.edit', fn (User $user) => $this->allows($user, 'products.edit', ['admin']));
        Gate::define('inventory.adjust', fn (User $user) => $this->allows($user, 'inventory.adjust', ['admin']));

        Gate::define('sales.create', fn (User $user) => $this->allows($user, 'sales.create', ['admin', 'salesman']));

        Gate::define('production.view', fn (User $user) => $this->allows($user, 'production.view', ['admin']));
        Gate::define('production.manage', fn (User $user) => $this->allows($user, 'production.manage', ['admin']));

        Gate::define('purchases.create', fn (User $user) => $this->allows($user, 'purchases.create', ['admin']));

        Gate::define('returns.create', fn (User $user) => $this->allows($user, 'returns.create', ['admin']));
        Gate::define('returns.process', fn (User $user) => $this->allows($user, 'returns.process', ['admin']));

        Gate::define('settings.update', fn (User $user) => $this->allows($user, 'settings.update', ['admin']));
        Gate::define('dashboard.view', fn (User $user) => $this->allows($user, 'dashboard.view', ['admin', 'salesman']));
    }

    private function allows(User $user, string $permission, array $roles): bool
    {
        if ($user->active === false) {
            return false;
        }

        if (in_array($user->role, $roles, true)) {
            return true;
        }

        return $user->getAllPermissions()->pluck('name')->contains($permission);
    }
}
