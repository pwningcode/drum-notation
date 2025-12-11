import { configureStore } from '@reduxjs/toolkit';
import songsReducer from './songsSlice';
import instrumentsReducer from './instrumentsSlice';
import migrationReducer from './migrationSlice';
import preferencesReducer from './preferencesSlice';
import { loadState, saveState } from './persistence';
import { loadInstruments, saveInstruments } from './instrumentPersistence';
import { loadMigrationState, saveMigrationState } from './migrationPersistence';
import { loadPreferences, savePreferences } from './preferencesPersistence';
import { configureMigrationDetection } from './migrationDetection';
import { initializeMigration } from './migrationSlice';
import { initializePreferences } from './preferencesSlice';

const store = configureStore({
  reducer: {
    songs: songsReducer,
    instruments: instrumentsReducer,
    migration: migrationReducer,
    preferences: preferencesReducer,
  },
});

// Load initial state for songs
const initialState = loadState();
if (initialState.songs) {
  store.dispatch({ type: 'songs/initializeSongs', payload: initialState.songs });
}

// Load initial instruments
const instrumentsState = loadInstruments();
store.dispatch({ type: 'instruments/initializeInstruments', payload: instrumentsState });

// Load migration state
const migrationState = loadMigrationState();
if (migrationState && Object.keys(migrationState).length > 0) {
  store.dispatch(initializeMigration(migrationState));
}

// Load preferences
const preferencesState = loadPreferences();
if (preferencesState && Object.keys(preferencesState).length > 0) {
  store.dispatch(initializePreferences(preferencesState));
}

// Configure migration detection (checks for version mismatches)
configureMigrationDetection(store);

// Save state to localStorage whenever it changes
store.subscribe(() => {
  const state = store.getState();

  // Save songs
  saveState(state);

  // Save instruments separately
  saveInstruments({
    version: state.instruments.version,
    instruments: state.instruments.instruments
  });

  // Save migration state separately
  saveMigrationState(state.migration);

  // Save preferences separately
  savePreferences(state.preferences);
});

export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
import { useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected>(selector: (state: RootState) => TSelected) => useSelector(selector);
