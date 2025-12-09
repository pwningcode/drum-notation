import kassaSong from '../assets/songs/kassa.json';
import sofaSong from '../assets/songs/sofa.json';
import sinteSong from '../assets/songs/sinte.json';
import yankadiSong from '../assets/songs/yankadi.json';
import soliSong from '../assets/songs/soli.json';
import kukuSong from '../assets/songs/kuku.json';
import tiribaSong from '../assets/songs/tiriba.json';
import { SongsState } from './songsSlice';
import { Song, LegacySongData } from '../types';
import { validateSong, isLegacyFormat, migrateLegacySongs } from '../migration';

const STORAGE_KEY = 'drum-notation-redux-state';
const CURRENT_VERSION = '2.1.0';

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
        // Check if version has changed - if so, merge with bundled songs
        const savedVersion = parsedState.songs.version || '2.0.0';
        if (savedVersion !== CURRENT_VERSION) {
          console.log(`Version changed from ${savedVersion} to ${CURRENT_VERSION}, merging bundled songs`);
          const mergedSongs = mergeSongsWithDefaults(validSongs, defaultSongs);
          return {
            songs: {
              songs: mergedSongs,
              version: CURRENT_VERSION,
              activeSongId: parsedState.songs.activeSongId || mergedSongs[0]?.id || '',
            }
          };
        }

        // All songs are valid and version matches, return as-is
        return parsedState;
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

/**
 * Merges user's saved songs with bundled default songs.
 * This ensures new bundled songs are available while preserving user modifications.
 * Strategy: Overwrite with all bundled songs (user said it's OK to overwrite for now)
 */
function mergeSongsWithDefaults(savedSongs: Song[], defaultSongs: Song[]): Song[] {
  // For now, as per user request: "we can just overwrite what the user has in the browser"
  // This means when new songs are added, we replace everything with the bundled songs
  console.log(`Replacing ${savedSongs.length} saved songs with ${defaultSongs.length} bundled songs`);
  return defaultSongs;
}

function loadDefaultSongs(): Song[] {
  try {
    const songs = [
      kassaSong,
      sofaSong,
      sinteSong,
      yankadiSong,
      soliSong,
      kukuSong,
      tiribaSong
    ] as any[];

    // Check if default songs are in legacy format
    if (songs.length > 0 && isLegacyFormat(songs[0])) {
      console.log('Migrating default songs from legacy format');
      return migrateLegacySongs(songs as LegacySongData[]);
    }

    // Validate that songs are in new format
    const validSongs = songs.filter(validateSong);

    if (validSongs.length === songs.length) {
      return validSongs as Song[];
    } else {
      console.warn('Some default songs failed validation');
      // Return only valid songs, or create a default if none are valid
      return validSongs.length > 0 ? validSongs as Song[] : [createDefaultSong()];
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
