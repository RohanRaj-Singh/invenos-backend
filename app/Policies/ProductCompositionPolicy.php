<?php

namespace App\Policies;

use App\Models\User;

class ProductCompositionPolicy
{
    public function view(User $user): bool
    {
        return $this->allows($user, 'products.composition.view', ['admin', 'salesman']);
    }

    public function manage(User $user): bool
    {
        return $this->allows($user, 'products.composition.manage', ['admin']);
    }

    /**
     * Whether the user may see composition cost information.
     *
     * Deliberately narrower than `view`: a formula's ingredient costs are
     * financial data, so seeing the recipe does not imply seeing what it costs.
     */
    public function cost(User $user): bool
    {
        return $this->allows($user, 'products.composition.cost', ['admin']);
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
