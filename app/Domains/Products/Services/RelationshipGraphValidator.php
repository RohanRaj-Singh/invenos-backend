<?php

namespace App\Domains\Products\Services;

/**
 * Validates that a set of unit relationships forms a single connected graph
 * anchored to the Default Unit, with no cycles, no duplicates, and no
 * disconnected subgraphs.
 *
 * Each relationship is: "1 [unit_name] = [quantity] [related_unit_name]"
 * e.g. "1 Box = 12 Strips" → { unit_name: 'Box', related_unit_name: 'Strip', quantity: 12 }
 */
class RelationshipGraphValidator
{
    /**
     * Validate a set of relationships.
     *
     * @param string $defaultUnitId The Default Unit ID (e.g. 'capsule')
     * @param array  $relationships Each: ['unit_name' => string, 'related_unit_name' => string, 'quantity' => float]
     * @return array{ valid: bool, errors: string[] }
     */
    public function validate(string $defaultUnitId, array $relationships): array
    {
        $errors = [];

        if (empty($relationships)) {
            return ['valid' => true, 'errors' => []];
        }

        // 1. Check for duplicate relationships
        $seen = [];
        foreach ($relationships as $i => $rel) {
            $key = $this->relationshipKey($rel);
            if (isset($seen[$key])) {
                $errors[] = "Duplicate relationship: 1 {$rel['unit_name']} = {$rel['quantity']} {$rel['related_unit_name']} already defined.";
            }
            $seen[$key] = true;
        }

        if (!empty($errors)) {
            return ['valid' => false, 'errors' => $errors];
        }

        // 2. Check for zero/negative quantities
        foreach ($relationships as $i => $rel) {
            if ($rel['quantity'] <= 0) {
                $errors[] = "Relationship #" . ($i + 1) . " has invalid quantity ({$rel['quantity']}). Quantity must be greater than 0.";
            }
        }

        if (!empty($errors)) {
            return ['valid' => false, 'errors' => $errors];
        }

        // 3. Check for circular references and build the graph
        $graph = $this->buildGraph($relationships);

        foreach ($graph as $nodeName => $deps) {
            if ($this->hasCycle($nodeName, $graph)) {
                $errors[] = "Circular reference detected involving '{$nodeName}'. Each unit should resolve back to the Default Unit without loops.";
            }
        }

        if (!empty($errors)) {
            return ['valid' => false, 'errors' => $errors];
        }

        // 4. Check that all nodes connect to the Default Unit
        $connected = $this->findConnectedNodes($defaultUnitId, $graph);
        foreach ($graph as $nodeName => $deps) {
            if (!in_array($nodeName, $connected)) {
                $errors[] = "'{$nodeName}' cannot be resolved back to the Default Unit ('{$defaultUnitId}'). Every unit must connect to the Default Unit.";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Build an adjacency map from the relationship list.
     * Each node maps to its "parent" (the unit closer to Default).
     */
    private function buildGraph(array $relationships): array
    {
        $graph = [];
        foreach ($relationships as $rel) {
            $a = $rel['unit_name'];
            $b = $rel['related_unit_name'];
            if (!isset($graph[$a])) $graph[$a] = [];
            if (!isset($graph[$b])) $graph[$b] = [];
            $graph[$a][] = $b;
            $graph[$b][] = $a;
        }
        return $graph;
    }

    /**
     * Detect if a cycle exists in the graph using DFS.
     */
    private function hasCycle(string $start, array $graph): bool
    {
        $visited = [];
        $stack = [[$start, null]];

        while (!empty($stack)) {
            [$node, $parent] = array_pop($stack);

            if (isset($visited[$node])) {
                // Check if this isn't just the parent being revisited
                $visited[$node]++;
                if ($visited[$node] > 2) {
                    return true;
                }
                continue;
            }

            $visited[$node] = 1;

            foreach ($graph[$node] ?? [] as $neighbor) {
                if ($neighbor !== $parent) {
                    $stack[] = [$neighbor, $node];
                }
            }
        }

        return false;
    }

    /**
     * Find all nodes connected to a given root using BFS.
     */
    private function findConnectedNodes(string $root, array $graph): array
    {
        $visited = [];
        $queue = [$root];

        while (!empty($queue)) {
            $node = array_shift($queue);
            if (isset($visited[$node])) continue;
            $visited[$node] = true;

            foreach ($graph[$node] ?? [] as $neighbor) {
                if (!isset($visited[$neighbor])) {
                    $queue[] = $neighbor;
                }
            }
        }

        return array_keys($visited);
    }

    /**
     * Create a canonical key for a relationship to detect duplicates.
     */
    private function relationshipKey(array $rel): string
    {
        $parts = [$rel['unit_name'], $rel['related_unit_name']];
        sort($parts);
        return $parts[0] . '|' . $parts[1];
    }
}
