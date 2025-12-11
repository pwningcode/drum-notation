/**
 * Migration Engine
 * Handles finding and executing migration paths between versions
 */

import { MigrationFunction } from './migrationRegistry';

export interface MigrationAnalysis {
  needed: boolean;
  fromVersion: string;
  toVersion: string;
  path: MigrationFunction<any>[];
  hasBreakingChanges: boolean;
  totalSteps: number;
  descriptions: string[];
}

/**
 * Find shortest migration path from source to target version using BFS
 */
export function findMigrationPath<T>(
  fromVersion: string,
  toVersion: string,
  migrations: MigrationFunction<T>[]
): MigrationFunction<T>[] | null {
  // If versions match, no migration needed
  if (fromVersion === toVersion) {
    return [];
  }

  // Build adjacency list for BFS
  const graph = new Map<string, MigrationFunction<T>[]>();
  migrations.forEach(migration => {
    if (!graph.has(migration.from)) {
      graph.set(migration.from, []);
    }
    graph.get(migration.from)!.push(migration);
  });

  // BFS to find shortest path
  const queue: { version: string; path: MigrationFunction<T>[] }[] = [
    { version: fromVersion, path: [] }
  ];
  const visited = new Set<string>([fromVersion]);

  while (queue.length > 0) {
    const { version, path } = queue.shift()!;

    // Check all migrations from this version
    const nextMigrations = graph.get(version) || [];
    for (const migration of nextMigrations) {
      if (migration.to === toVersion) {
        // Found the target!
        return [...path, migration];
      }

      if (!visited.has(migration.to)) {
        visited.add(migration.to);
        queue.push({
          version: migration.to,
          path: [...path, migration]
        });
      }
    }
  }

  // No path found
  return null;
}

/**
 * Analyze if migration is needed and what it entails
 */
export function analyzeMigration<T>(
  fromVersion: string,
  toVersion: string,
  migrations: MigrationFunction<T>[]
): MigrationAnalysis {
  if (fromVersion === toVersion) {
    return {
      needed: false,
      fromVersion,
      toVersion,
      path: [],
      hasBreakingChanges: false,
      totalSteps: 0,
      descriptions: []
    };
  }

  const path = findMigrationPath(fromVersion, toVersion, migrations);

  if (!path) {
    // No migration path available
    return {
      needed: true,
      fromVersion,
      toVersion,
      path: [],
      hasBreakingChanges: false,
      totalSteps: 0,
      descriptions: [`No migration path available from ${fromVersion} to ${toVersion}`]
    };
  }

  const hasBreakingChanges = path.some(m => m.breaking === true);
  const descriptions = path.map(m => `${m.from} → ${m.to}: ${m.description}`);

  return {
    needed: true,
    fromVersion,
    toVersion,
    path,
    hasBreakingChanges,
    totalSteps: path.length,
    descriptions
  };
}

/**
 * Apply migration path to data
 */
export function applyMigrationPath<T>(
  data: T,
  path: MigrationFunction<T>[]
): { success: boolean; data?: T; error?: string } {
  try {
    let result = data;

    for (const migration of path) {
      console.log(`[Migration] Applying ${migration.from} → ${migration.to}: ${migration.description}`);
      result = migration.migrate(result);
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    };
  }
}

/**
 * Check if a version is newer than another
 */
export function isNewerVersion(versionA: string, versionB: string): boolean {
  const parseVersion = (v: string) => v.split('.').map(Number);
  const a = parseVersion(versionA);
  const b = parseVersion(versionB);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const numA = a[i] || 0;
    const numB = b[i] || 0;
    if (numA > numB) return true;
    if (numA < numB) return false;
  }
  return false;
}
