import kassaSong from '../assets/songs/kassa.json';
import sofaSong from '../assets/songs/sofa.json';
import sinteSong from '../assets/songs/sinte.json';
import yankadiSong from '../assets/songs/yankadi.json';
import soliSong from '../assets/songs/soli.json';
import kukuSong from '../assets/songs/kuku.json';
import tiribaSong from '../assets/songs/tiriba.json';
import kassaMultiCycleSong from '../assets/songs/kassa-multi-cycle.json';
import { SongsState } from './songsSlice';
import { Song, LegacySongData } from '../types';
import { validateSong, isLegacyFormat, migrateLegacySongs, migrateAllToMultiCycle } from '../migration';
import { SONGS_SCHEMA_VERSION, MIN_SONGS_VERSION, meetsMinimumVersion } from '../config/schemaVersions';

const STORAGE_KEY = 'drum-notation-redux-state';
const CURRENT_VERSION = SONGS_SCHEMA_VERSION;

interface RootState {
  songs: SongsState;
}

export const loadState = (): Partial<RootState> => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);

    // Load default songs and migrate them if needed
    const defaultSongs = loadDefaultSongs();

    if (serializedState === null) {
      // No saved state, use migrated default data
      console.log('No saved state found, using default songs');
      return {
        songs: {
          songs: defaultSongs,
          version: CURRENT_VERSION,
          activeSongId: defaultSongs[0]?.id || '',
        }
      };
    }

    const parsedState = JSON.parse(serializedState);

    // Check if saved version meets minimum requirements
    const savedVersion = parsedState?.songs?.version || '2.0.0';
    if (!meetsMinimumVersion(savedVersion, MIN_SONGS_VERSION)) {
      console.warn(`Saved version ${savedVersion} is below minimum required version ${MIN_SONGS_VERSION}. Resetting to defaults.`);
      // Clear the old data and return defaults
      localStorage.removeItem(STORAGE_KEY);
      return {
        songs: {
          songs: defaultSongs,
          version: CURRENT_VERSION,
          activeSongId: defaultSongs[0]?.id || '',
        }
      };
    }

    // Check if we need to migrate legacy format
    if (parsedState?.songs?.songs && Array.isArray(parsedState.songs.songs)) {
      const firstSong = parsedState.songs.songs[0];

      if (firstSong && isLegacyFormat(firstSong)) {
        console.log('Migrating legacy song format to new format');
        const migratedSongs = migrateLegacySongs(parsedState.songs.songs as LegacySongData[]);
        return {
          songs: {
            songs: migratedSongs,
            version: CURRENT_VERSION,
            activeSongId: migratedSongs[0]?.id || '',
          }
        };
      }
    }

    // Validate existing songs
    if (parsedState?.songs?.songs && Array.isArray(parsedState.songs.songs)) {
      const validSongs = parsedState.songs.songs.filter((song: any) => validateSong(song));

      if (validSongs.length === parsedState.songs.songs.length) {
        // Add displayOrder to songs that don't have it
        const songsWithOrder = validSongs.map((song: any, index: number) => ({
          ...song,
          displayOrder: song.displayOrder ?? index
        }));

        // IMPORTANT: DO NOT auto-migrate on version mismatch
        // This was causing data loss by overwriting all user songs with defaults
        // Migration will be handled by the migration dialog system instead
        const savedVersion = parsedState.songs.version || '2.0.0';
        if (savedVersion !== CURRENT_VERSION) {
          console.log(`Version mismatch: saved ${savedVersion}, current ${CURRENT_VERSION}. Migration system will handle this.`);
          // Return user's data as-is - migration dialog will offer options
        }

        // Apply multi-cycle migration to ensure all songs have the new fields
        const migratedSongs = migrateAllToMultiCycle(songsWithOrder);

        // All songs are valid, return with displayOrder and migrations applied
        return {
          songs: {
            songs: migratedSongs,
            version: parsedState.songs.version,
            activeSongId: parsedState.songs.activeSongId
          }
        };
      } else {
        console.warn('Some songs failed validation, using default songs');
        return {
          songs: {
            songs: defaultSongs,
            version: CURRENT_VERSION,
            activeSongId: defaultSongs[0]?.id || '',
          }
        };
      }
    }

    // If we can't parse the state properly, use defaults
    console.warn('Could not parse saved state, using default songs');
    return {
      songs: {
        songs: defaultSongs,
        version: CURRENT_VERSION,
        activeSongId: defaultSongs[0]?.id || '',
      }
    };
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    // Return migrated default data on error
    const defaultSongs = loadDefaultSongs();
    return {
      songs: {
        songs: defaultSongs,
        version: CURRENT_VERSION,
        activeSongId: defaultSongs[0]?.id || '',
      }
    };
  }
};

export const saveState = (state: RootState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

// NOTE: The old mergeSongsWithDefaults() function has been removed because it caused data loss.
// It was automatically overwriting all user data with defaults on version changes.
// Smart merging will be handled by the migration system instead (see src/migration/mergeStrategy.ts)

export function loadDefaultSongs(): Song[] {
  try {
    const songs = [
      kassaSong,
      sofaSong,
      sinteSong,
      yankadiSong,
      soliSong,
      kukuSong,
      tiribaSong,
      kassaMultiCycleSong
    ] as any[];

    // Check if default songs are in legacy format
    if (songs.length > 0 && isLegacyFormat(songs[0])) {
      console.log('Migrating default songs from legacy format');
      return migrateLegacySongs(songs as LegacySongData[]);
    }

    // Validate that songs are in new format
    const validSongs = songs.filter(validateSong);

    if (validSongs.length === songs.length) {
      // Add displayOrder to songs that don't have it
      const songsWithOrder = (validSongs as Song[]).map((song, index) => ({
        ...song,
        displayOrder: song.displayOrder ?? index
      }));
      // Apply multi-cycle migration
      return migrateAllToMultiCycle(songsWithOrder);
    } else {
      console.warn('Some default songs failed validation');
      // Return only valid songs, or create a default if none are valid
      const songsToReturn = validSongs.length > 0 ? validSongs as Song[] : [createDefaultSong()];
      const songsWithOrder = songsToReturn.map((song, index) => ({
        ...song,
        displayOrder: song.displayOrder ?? index
      }));
      // Apply multi-cycle migration
      return migrateAllToMultiCycle(songsWithOrder);
    }
  } catch (error) {
    console.error('Error loading default songs:', error);
    return [createDefaultSong()];
  }
}

function createDefaultSong(): Song {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-default`,
    title: 'New Song',
    tempo: 120,
    displayOrder: 0,
    sections: [{
      id: `${Date.now()}-intro`,
      name: 'Intro',
      measures: [{
        id: `${Date.now()}-measure`,
        timeSignature: { beats: 4, division: 4, divisionType: 'sixteenth' },
        tracks: [{
          id: `${Date.now()}-track`,
          instrument: 'djembe',
          notes: Array(16).fill('.')
        }]
      }]
    }],
    created: now,
    modified: now
  };
}
