/**
 * Migration System Public API
 * Exports all migration-related functions and types
 */

export {
  type MigrationFunction,
  SONGS_MIGRATIONS,
  INSTRUMENTS_MIGRATIONS
} from './migrationRegistry';

export {
  type MigrationAnalysis,
  findMigrationPath,
  analyzeMigration,
  applyMigrationPath,
  isNewerVersion
} from './migrationEngine';

export {
  type MergeOptions,
  type MergeResult,
  mergeSongsWithDefaults,
  mergeInstrumentsWithDefaults,
  DEFAULT_MERGE_OPTIONS
} from './mergeStrategy';
