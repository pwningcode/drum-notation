import defaultSongsData from '../defaultSongs.json';
import { SongsState } from './songsSlice';

const STORAGE_KEY = 'drum-notation-redux-state';

interface RootState {
  songs: SongsState;
}

export const loadState = (): Partial<RootState> => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      // No saved state, use default data
      return {
        songs: {
          songs: defaultSongsData.songs as any,
          version: defaultSongsData.version,
          activeSongTitle: defaultSongsData.songs[0]?.title || '',
        }
      };
    }

    const parsedState = JSON.parse(serializedState);
    
    // Check if we need to update from default data
    if (shouldUpdateFromDefault(parsedState)) {
      console.log('Updating from newer default data');
      return {
        songs: {
          songs: defaultSongsData.songs as any,
          version: defaultSongsData.version,
          activeSongTitle: defaultSongsData.songs[0]?.title || '',
        }
      };
    }

    return parsedState;
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    // Return default data on error
    return {
      songs: {
        songs: defaultSongsData.songs as any,
        version: defaultSongsData.version,
        activeSongTitle: defaultSongsData.songs[0]?.title || '',
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

const shouldUpdateFromDefault = (savedState: any): boolean => {
  // Check if saved state has a version and compare with default
  if (!savedState?.songs?.version || !defaultSongsData.version) {
    return true;
  }

  // Simple version comparison (you might want to use a proper semver library)
  const savedVersion = savedState.songs.version;
  const defaultVersion = defaultSongsData.version;
  
  // If versions are different, update from default
  return savedVersion !== defaultVersion;
};
