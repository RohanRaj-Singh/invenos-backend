<?php

namespace App\Domains\Backup\Support;

final class SqlSplitter
{
    /**
     * Split a MySQL dump into executable statements while respecting
     * quotes, comments and the DELIMITER directive used by routines.
     *
     * @return string[]
     */
    public static function split(string $sql): array
    {
        $statements = [];
        $buffer = '';
        $delimiter = ';';
        $length = strlen($sql);
        $state = 'normal';

        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $next = $i + 1 < $length ? $sql[$i + 1] : '';

            if ($state === 'normal' && trim($buffer) === '' && $char !== ' ' && $char !== "\n" && $char !== "\r" && $char !== "\t") {
                if (stripos(substr($sql, $i, 10), 'DELIMITER ') === 0) {
                    $lineEnd = strpos($sql, "\n", $i);
                    $lineEnd = $lineEnd === false ? $length : $lineEnd;
                    $delimiter = trim(substr($sql, $i + 10, $lineEnd - $i - 10));
                    if ($delimiter === '') {
                        $delimiter = ';';
                    }
                    $buffer = '';
                    $i = $lineEnd;
                    continue;
                }
            }

            if ($state === 'normal') {
                if ($char === "'" || $char === '"' || $char === '`') {
                    $state = $char;
                    $buffer .= $char;
                    continue;
                }

                if ($char === '-' && $next === '-' && ($i + 2 >= $length || in_array($sql[$i + 2], [' ', "\t", "\n", "\r"], true))) {
                    $state = 'line-comment';
                    $buffer .= $char;
                    continue;
                }

                if ($char === '#') {
                    $state = 'line-comment';
                    $buffer .= $char;
                    continue;
                }

                if ($char === '/' && $next === '*') {
                    $state = 'block-comment';
                    $buffer .= $char.$next;
                    $i++;
                    continue;
                }

                if (substr($sql, $i, strlen($delimiter)) === $delimiter) {
                    $statement = trim($buffer);
                    if ($statement !== '') {
                        $statements[] = $statement;
                    }
                    $buffer = '';
                    $i += strlen($delimiter) - 1;
                    continue;
                }

                $buffer .= $char;
                continue;
            }

            if ($state === 'line-comment') {
                $buffer .= $char;
                if ($char === "\n") {
                    $state = 'normal';
                }
                continue;
            }

            if ($state === 'block-comment') {
                $buffer .= $char;
                if ($char === '*' && $next === '/') {
                    $buffer .= $next;
                    $i++;
                    $state = 'normal';
                }
                continue;
            }

            // Quoted string / identifier
            $buffer .= $char;

            if ($char === '\\' && $state !== '`' && $i + 1 < $length) {
                $buffer .= $sql[++$i];
                continue;
            }

            if ($char === $state) {
                if ($state !== '`' && $next === $state) {
                    $buffer .= $next;
                    $i++;
                    continue;
                }
                $state = 'normal';
            }
        }

        $tail = trim($buffer);
        if ($tail !== '') {
            $statements[] = $tail;
        }

        return $statements;
    }
}
