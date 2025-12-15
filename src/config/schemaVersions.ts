/**
 * Schema Version Management
 *
 * IMPORTANT FOR AI AGENTS:
 * - Increment SONGS_SCHEMA_VERSION when making breaking changes to Song interface
 * - Increment INSTRUMENTS_SCHEMA_VERSION when making breaking changes to InstrumentConfig interface
 * - Breaking changes include: removing fields, changing field types, renaming fields
 * - Non-breaking changes: adding optional fields (use `field?: type`)
 * - When incrementing version, add a migration function in the corresponding registry
 *
 * Version format: MAJOR.MINOR.PATCH (semver)
 * - MAJOR: Breaking changes requiring migration
 * - MINOR: New optional fields (backward compatible)
 * - PATCH: Bug fixes, no schema changes
 */

export const SONGS_SCHEMA_VERSION = '2.2.1';
export const INSTRUMENTS_SCHEMA_VERSION = '1.0.0';

// App version - should match package.json
export const APP_VERSION = '2.2.1';

/**
 * Minimum supported versions - data below these versions will be reset to defaults
 * This is useful for forcing a clean slate when there are significant breaking changes
 * that cannot be easily migrated.
 *
 * IMPORTANT: Only increment these when you want to force all users below this version
 * to reset their data. Use with caution!
 *
 * How it works:
 * - When a user loads the app, their saved version is compared to the minimum version
 * - If savedVersion < minVersion, their localStorage data is cleared and defaults are loaded
 * - This ensures users with very old/incompatible data get a fresh start
 * - The user will see the welcome dialog again as if they're a first-time user
 *
 * Example scenarios:
 * - User has version 2.1.0, MIN_SONGS_VERSION is 2.2.0 → Data reset, use defaults
 * - User has version 2.2.0, MIN_SONGS_VERSION is 2.2.0 → Data kept, no reset
 * - User has version 2.3.0, MIN_SONGS_VERSION is 2.2.0 → Data kept, migration dialog may show
 */
export const MIN_SONGS_VERSION = '2.2.0';
export const MIN_INSTRUMENTS_VERSION = '1.0.0';

/**
 * Compare two semver version strings
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * Check if a version meets the minimum requirement
 */
export function meetsMinimumVersion(version: string, minVersion: string): boolean {
  return compareVersions(version, minVersion) >= 0;
}

/**
 * Change History:
 *
 * SONGS:
 * - 2.2.1: Removed kassa-multi-cycle from default songs; Updated default instruments to enable flams for all notes except rest
 * - 2.2.0: Added visible (optional) field to InstrumentTrack for track visibility
 * - 2.1.0: Added displayOrder (optional) and links (optional) fields
 * - 2.0.0: Migrated from legacy format
 *
 * INSTRUMENTS:
 * - 1.0.0: Initial schema with dynamic instrument configuration
 */
