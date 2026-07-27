<?php

namespace App\Services;

/**
 * BusinessContext provides the current business context for the application.
 *
 * Currently a singleton business (single-tenant). If multi-tenancy is needed
 * in the future, this is the natural extension point for resolving the
 * current tenant/business from the request.
 *
 * Usage:
 *   BusinessContext::current()->id
 *   BusinessContext::current()->name
 */
class BusinessContext
{
    private static ?self $instance = null;

    public readonly string $id;
    public readonly string $name;

    private function __construct()
    {
        // TODO: Resolve from authenticated user's business in Phase 2
        $this->id = '1';
        $this->name = 'Invenos';
    }

    public static function current(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function id(): string
    {
        return self::current()->id;
    }
}
