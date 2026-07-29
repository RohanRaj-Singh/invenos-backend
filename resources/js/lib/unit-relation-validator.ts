/**
 * Unit Relationship Validator
 *
 * Validates that a set of unit relationships forms a single connected graph
 * anchored to the Default Unit, with no cycles, no duplicates, and no
 * disconnected subgraphs.
 *
 * Mirrors the backend RelationshipGraphValidator for instant client-side feedback.
 */

export interface UnitRelation {
  /** Client-side key for React rendering */
  _key: string
  /** Display name: "Box", "Strip", etc. */
  unitName: string
  /** Related unit: "Strip", "Capsule", etc. */
  relatedUnitName: string
  /** How many of the related unit in 1 of this unit */
  quantity: number
  /** Sale price per this unit (null = not sold in this unit) */
  salePrice: number | null
  /** Purchase cost per this unit (null = not purchased in this unit) */
  purchaseCost: number | null
  /** Barcode for this unit */
  barcode?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate a set of unit relationships.
 *
 * Rules:
 * 1. No duplicate relationships (same pair already defined)
 * 2. No zero/negative quantities
 * 3. No circular references
 * 4. All nodes must connect to the Default Unit
 */
export function validateRelationships(
  defaultUnitName: string,
  relationships: UnitRelation[]
): ValidationResult {
  const errors: string[] = []

  if (relationships.length === 0) {
    return { valid: true, errors: [] }
  }

  // 1. Check for duplicate relationships
  const seen = new Set<string>()
  for (const rel of relationships) {
    const key = [rel.unitName, rel.relatedUnitName].sort().join('|')
    if (seen.has(key)) {
      errors.push(`Duplicate relationship: 1 ${rel.unitName} = ${rel.quantity} ${rel.relatedUnitName}`)
    }
    seen.add(key)
  }

  if (errors.length > 0) return { valid: false, errors }

  // 2. Check for zero/negative quantities
  for (const rel of relationships) {
    if (rel.quantity <= 0) {
      errors.push(`"${rel.unitName}" has invalid quantity (${rel.quantity}). Quantity must be greater than 0.`)
    }
  }

  if (errors.length > 0) return { valid: false, errors }

  // 3. Build graph for cycle + connectivity checks
  const graph = buildGraph(relationships)

  // 4. Check for circular references
  for (const nodeName of Object.keys(graph)) {
    if (hasCycle(nodeName, graph)) {
      errors.push(`Circular reference detected involving "${nodeName}". Units should form a chain.`)
    }
  }

  if (errors.length > 0) return { valid: false, errors }

  // 5. Check all nodes connect to Default Unit
  const connected = findConnectedNodes(defaultUnitName, graph)
  for (const nodeName of Object.keys(graph)) {
    if (!connected.includes(nodeName)) {
      errors.push(`"${nodeName}" cannot be resolved back to the Default Unit ("${defaultUnitName}").`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Build an undirected adjacency graph from relationships.
 */
function buildGraph(relationships: UnitRelation[]): Record<string, string[]> {
  const graph: Record<string, string[]> = {}
  for (const rel of relationships) {
    if (!graph[rel.unitName]) graph[rel.unitName] = []
    if (!graph[rel.relatedUnitName]) graph[rel.relatedUnitName] = []
    graph[rel.unitName].push(rel.relatedUnitName)
    graph[rel.relatedUnitName].push(rel.unitName)
  }
  return graph
}

/**
 * Detect cycles using DFS.
 */
function hasCycle(start: string, graph: Record<string, string[]>): boolean {
  const visited = new Set<string>()

  function dfs(node: string, parent: string | null): boolean {
    if (visited.has(node)) return true
    visited.add(node)

    for (const neighbor of graph[node] || []) {
      if (neighbor !== parent) {
        if (dfs(neighbor, node)) return true
      }
    }

    visited.delete(node)
    return false
  }

  return dfs(start, null)
}

/**
 * Find all nodes connected to a root via BFS.
 */
function findConnectedNodes(root: string, graph: Record<string, string[]>): string[] {
  const visited = new Set<string>()
  const queue = [root]

  while (queue.length > 0) {
    const node = queue.shift()!
    if (visited.has(node)) continue
    visited.add(node)

    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor)
      }
    }
  }

  return Array.from(visited)
}
