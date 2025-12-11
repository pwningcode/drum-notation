/**
 * Migration Registry
 * Defines version-specific migrations for Songs and Instruments
 */

import { Song, InstrumentConfig } from '../types';

export interface MigrationFunction<T> {
  from: string;          // Source version
  to: string;            // Target version
  migrate: (data: T) => T;
  description: string;   // User-friendly description
  breaking?: boolean;    // Requires user confirmation (default: false)
}

/**
 * Songs Migrations
 * Add new migrations here when SONGS_SCHEMA_VERSION is incremented
 */
export const SONGS_MIGRATIONS: MigrationFunction<Song[]>[] = [
  {
    from: '2.0.0',
    to: '2.1.0',
    description: 'Added displayOrder and links support',
    breaking: false,
    migrate: (songs) => songs.map((song, index) => ({
      ...song,
      displayOrder: song.displayOrder ?? index,
      links: song.links ?? []
    }))
  }
  // Future migrations will be added here
];

/**
 * Instruments Migrations
 * Add new migrations here when INSTRUMENTS_SCHEMA_VERSION is incremented
 */
export const INSTRUMENTS_MIGRATIONS: MigrationFunction<InstrumentConfig[]>[] = [
  // Currently at 1.0.0, no migrations yet
  // Future migrations will go here when schema changes
  // Example:
  // {
  //   from: '1.0.0',
  //   to: '1.1.0',
  //   description: 'Added new field to instrument config',
  //   breaking: false,
  //   migrate: (instruments) => instruments.map(instrument => ({
  //     ...instrument,
  //     newField: defaultValue
  //   }))
  // }
];
