/**
 * Migration Detection
 * Checks for version mismatches on app startup and triggers migration dialogs
 */

import { Store } from '@reduxjs/toolkit';
import { SONGS_SCHEMA_VERSION, INSTRUMENTS_SCHEMA_VERSION } from '../config/schemaVersions';
import { SONGS_MIGRATIONS, INSTRUMENTS_MIGRATIONS } from '../migration/migrationRegistry';
import { analyzeMigration } from '../migration/migrationEngine';
import {
  setPendingSongMigration,
  setPendingInstrumentMigration
} from './migrationSlice';

/**
 * Configure migration detection for the store
 * This should be called once during app initialization
 */
export function configureMigrationDetection(store: Store): void {
  // Get current state
  const state = store.getState();
  const songVersion = state.songs?.version || '2.0.0';
  const instrumentVersion = state.instruments?.version || '1.0.0';
  const migrationState = state.migration;

  // Check songs for version mismatch
  if (songVersion !== SONGS_SCHEMA_VERSION) {
    // Check if this version has been dismissed
    const isDismissed = migrationState?.songs?.dismissedVersions?.includes(SONGS_SCHEMA_VERSION);

    if (!isDismissed) {
      console.log(`[Migration] Song version mismatch detected: ${songVersion} → ${SONGS_SCHEMA_VERSION}`);

      // Analyze what migration is needed
      const analysis = analyzeMigration(
        songVersion,
        SONGS_SCHEMA_VERSION,
        SONGS_MIGRATIONS
      );

      if (analysis.needed) {
        console.log(`[Migration] Songs migration needed:`, analysis);
        store.dispatch(setPendingSongMigration(analysis));
      }
    } else {
      console.log(`[Migration] Song version ${SONGS_SCHEMA_VERSION} was previously dismissed`);
    }
  }

  // Check instruments for version mismatch
  if (instrumentVersion !== INSTRUMENTS_SCHEMA_VERSION) {
    // Check if this version has been dismissed
    const isDismissed = migrationState?.instruments?.dismissedVersions?.includes(INSTRUMENTS_SCHEMA_VERSION);

    if (!isDismissed) {
      console.log(`[Migration] Instrument version mismatch detected: ${instrumentVersion} → ${INSTRUMENTS_SCHEMA_VERSION}`);

      // Analyze what migration is needed
      const analysis = analyzeMigration(
        instrumentVersion,
        INSTRUMENTS_SCHEMA_VERSION,
        INSTRUMENTS_MIGRATIONS
      );

      if (analysis.needed) {
        console.log(`[Migration] Instruments migration needed:`, analysis);
        store.dispatch(setPendingInstrumentMigration(analysis));
      }
    } else {
      console.log(`[Migration] Instrument version ${INSTRUMENTS_SCHEMA_VERSION} was previously dismissed`);
    }
  }
}
