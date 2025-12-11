/**
 * Migration Persistence
 * Handles saving and loading migration state from localStorage
 */

import { MigrationState } from './migrationSlice';

const MIGRATION_STORAGE_KEY = 'drum-notation-migration-state';

/**
 * Load migration state from localStorage
 */
export function loadMigrationState(): Partial<MigrationState> {
  try {
    const stored = localStorage.getItem(MIGRATION_STORAGE_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Partial<MigrationState>;

    // Validate structure
    if (typeof parsed !== 'object') {
      console.warn('[Migration] Invalid stored migration state');
      return {};
    }

    // Only persist certain fields (not pending migrations or dialog state)
    return {
      songs: {
        pendingMigration: null, // Don't persist pending migrations
        lastMigration: parsed.songs?.lastMigration || null,
        dismissedVersions: parsed.songs?.dismissedVersions || []
      },
      instruments: {
        pendingMigration: null, // Don't persist pending migrations
        lastMigration: parsed.instruments?.lastMigration || null,
        dismissedVersions: parsed.instruments?.dismissedVersions || []
      },
      dialogOpen: false // Always start with dialog closed
    };
  } catch (error) {
    console.error('[Migration] Error loading migration state:', error);
    return {};
  }
}

/**
 * Save migration state to localStorage
 */
export function saveMigrationState(state: MigrationState): void {
  try {
    // Only persist certain fields
    const toSave = {
      songs: {
        lastMigration: state.songs.lastMigration,
        dismissedVersions: state.songs.dismissedVersions
      },
      instruments: {
        lastMigration: state.instruments.lastMigration,
        dismissedVersions: state.instruments.dismissedVersions
      }
    };

    const serialized = JSON.stringify(toSave);
    localStorage.setItem(MIGRATION_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('[Migration] Error saving migration state:', error);
  }
}

/**
 * Clear migration state from localStorage
 */
export function clearMigrationState(): void {
  try {
    localStorage.removeItem(MIGRATION_STORAGE_KEY);
  } catch (error) {
    console.error('[Migration] Error clearing migration state:', error);
  }
}
