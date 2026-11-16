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
