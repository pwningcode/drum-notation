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

export const SONGS_SCHEMA_VERSION = '2.1.0';
export const INSTRUMENTS_SCHEMA_VERSION = '1.0.0';

/**
 * Change History:
 *
 * SONGS:
 * - 2.1.0: Added displayOrder (optional) and links (optional) fields
 * - 2.0.0: Migrated from legacy format
 *
 * INSTRUMENTS:
 * - 1.0.0: Initial schema with dynamic instrument configuration
 */
