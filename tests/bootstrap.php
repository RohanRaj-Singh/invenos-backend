<?php

require __DIR__ . '/../vendor/autoload.php';

/*
 * Make the testing configuration win over the invoking shell.
 *
 * PHPUnit's <env> block writes to $_ENV and the process environment, but Laravel's
 * Dotenv repository reads $_SERVER first and is immutable. So when the shell already
 * exports APP_ENV=local / DB_DATABASE=invenos, those win over phpunit.xml and the
 * suite silently runs in local mode against the DEV database — CSRF enforced (every
 * POST test gets a 419) and RefreshDatabase refreshing development data.
 *
 * Mirroring $_ENV into $_SERVER makes the values declared in phpunit.xml authoritative
 * regardless of what the caller's environment happens to contain.
 */
foreach ($_ENV as $name => $value) {
    if (is_string($value)) {
        $_SERVER[$name] = $value;
    }
}
