import { configureStore } from '@reduxjs/toolkit';
import songsReducer from './songsSlice';
import instrumentsReducer from './instrumentsSlice';
import { loadState, saveState } from './persistence';
import { loadInstruments, saveInstruments } from './instrumentPersistence';

const store = configureStore({
  reducer: {
    songs: songsReducer,
    instruments: instrumentsReducer,
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
});

export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
import { useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected>(selector: (state: RootState) => TSelected) => useSelector(selector);
