/**
 * Merge Strategy
 * Smart merging of user data with defaults, including conflict detection
 */

import { Song, InstrumentConfig } from '../types';

export interface MergeOptions {
  preserveUserData: boolean;     // Keep custom/modified items
  addNewDefaults: boolean;       // Add new bundled items
  updateModified: boolean;       // Overwrite user-modified defaults
  removeDeleted: boolean;        // Remove items no longer in defaults
}

export interface MergeResult<T> {
  merged: T[];
  added: T[];           // New items from defaults
  updated: T[];         // Items that were updated
  preserved: T[];       // User items that were kept
  conflicts: T[];       // User-modified defaults
}

/**
 * Compare two songs for equality (ignoring metadata like modified date)
 */
function areSongsEqual(song1: Song, song2: Song): boolean {
  // Compare everything except id, created, modified, and displayOrder
  if (song1.title !== song2.title) return false;
  if (song1.description !== song2.description) return false;
  if (song1.tempo !== song2.tempo) return false;
  if (JSON.stringify(song1.links) !== JSON.stringify(song2.links)) return false;
  if (song1.sections.length !== song2.sections.length) return false;

  // Deep compare sections (simplified - could be more thorough)
  return JSON.stringify(song1.sections) === JSON.stringify(song2.sections);
}

/**
 * Merge user songs with default songs
 */
export function mergeSongsWithDefaults(
  userSongs: Song[],
  defaultSongs: Song[],
  options: MergeOptions
): MergeResult<Song> {
  const result: MergeResult<Song> = {
    merged: [],
    added: [],
    updated: [],
    preserved: [],
    conflicts: []
  };

  // Create maps for quick lookup
  const userMap = new Map(userSongs.map(s => [s.title, s]));
  const defaultMap = new Map(defaultSongs.map(s => [s.title, s]));

  // Process default songs
  defaultSongs.forEach((defaultSong, index) => {
    const userSong = userMap.get(defaultSong.title);

    if (!userSong) {
      // New default song not in user's collection
      if (options.addNewDefaults) {
        const newSong = {
          ...defaultSong,
          displayOrder: defaultSong.displayOrder ?? index
        };
        result.merged.push(newSong);
        result.added.push(newSong);
      }
    } else {
      // Song exists in both user's and defaults
      const isModified = !areSongsEqual(userSong, defaultSong);

      if (isModified) {
        // User has modified this default song
        result.conflicts.push(userSong);

        if (options.updateModified) {
          // Overwrite with default
          const updated = {
            ...defaultSong,
            displayOrder: userSong.displayOrder ?? index
          };
          result.merged.push(updated);
          result.updated.push(updated);
        } else {
          // Keep user's version
          result.merged.push(userSong);
          result.preserved.push(userSong);
        }
      } else {
        // Song is up-to-date
        result.merged.push(userSong);
        result.preserved.push(userSong);
      }
    }
  });

  // Process user-only songs (custom songs not in defaults)
  if (options.preserveUserData) {
    userSongs.forEach(userSong => {
      if (!defaultMap.has(userSong.title)) {
        // Custom song - keep it
        result.merged.push(userSong);
        result.preserved.push(userSong);
      }
    });
  }

  // Sort by displayOrder
  result.merged.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return result;
}

/**
 * Compare two instruments for equality (ignoring metadata)
 */
function areInstrumentsEqual(inst1: InstrumentConfig, inst2: InstrumentConfig): boolean {
  // Compare everything except created, modified, and displayOrder
  if (inst1.key !== inst2.key) return false;
  if (inst1.name !== inst2.name) return false;
  if (inst1.description !== inst2.description) return false;
  if (inst1.color !== inst2.color) return false;
  if (JSON.stringify(inst1.availableNotes) !== JSON.stringify(inst2.availableNotes)) return false;
  if (JSON.stringify(inst1.cycleOrder) !== JSON.stringify(inst2.cycleOrder)) return false;
  if (JSON.stringify(inst1.noteLabels) !== JSON.stringify(inst2.noteLabels)) return false;
  if (JSON.stringify(inst1.noteColors) !== JSON.stringify(inst2.noteColors)) return false;
  if (JSON.stringify(inst1.noteSymbols) !== JSON.stringify(inst2.noteSymbols)) return false;
  if (JSON.stringify(inst1.flamNotes) !== JSON.stringify(inst2.flamNotes)) return false;
  return true;
}

/**
 * Merge user instruments with default instruments
 * Uses 'key' field for matching instead of 'title'
 */
export function mergeInstrumentsWithDefaults(
  userInstruments: InstrumentConfig[],
  defaultInstruments: InstrumentConfig[],
  options: MergeOptions
): MergeResult<InstrumentConfig> {
  const result: MergeResult<InstrumentConfig> = {
    merged: [],
    added: [],
    updated: [],
    preserved: [],
    conflicts: []
  };

  // Create maps for quick lookup by key
  const userMap = new Map(userInstruments.map(i => [i.key, i]));
  const defaultMap = new Map(defaultInstruments.map(i => [i.key, i]));

  // Process default instruments
  defaultInstruments.forEach((defaultInst, index) => {
    const userInst = userMap.get(defaultInst.key);

    if (!userInst) {
      // New default instrument not in user's collection
      if (options.addNewDefaults) {
        const newInst = {
          ...defaultInst,
          displayOrder: defaultInst.displayOrder ?? index
        };
        result.merged.push(newInst);
        result.added.push(newInst);
      }
    } else {
      // Instrument exists in both user's and defaults
      const isModified = !areInstrumentsEqual(userInst, defaultInst);

      if (isModified) {
        // User has modified this default instrument
        result.conflicts.push(userInst);

        if (options.updateModified) {
          // Overwrite with default
          const updated = {
            ...defaultInst,
            displayOrder: userInst.displayOrder ?? index
          };
          result.merged.push(updated);
          result.updated.push(updated);
        } else {
          // Keep user's version
          result.merged.push(userInst);
          result.preserved.push(userInst);
        }
      } else {
        // Instrument is up-to-date
        result.merged.push(userInst);
        result.preserved.push(userInst);
      }
    }
  });

  // Process user-only instruments (custom instruments not in defaults)
  if (options.preserveUserData) {
    userInstruments.forEach(userInst => {
      if (!defaultMap.has(userInst.key)) {
        // Custom instrument - keep it
        result.merged.push(userInst);
        result.preserved.push(userInst);
      }
    });
  }

  // Sort by displayOrder
  result.merged.sort((a, b) => a.displayOrder - b.displayOrder);

  return result;
}

/**
 * Default merge options - preserve everything, add new defaults
 */
export const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  preserveUserData: true,
  addNewDefaults: true,
  updateModified: false,
  removeDeleted: false
};
