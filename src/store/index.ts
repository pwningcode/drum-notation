import { configureStore } from '@reduxjs/toolkit';
import songsReducer from './songsSlice';
import { loadState, saveState } from './persistence';

const store = configureStore({
  reducer: {
    songs: songsReducer,
  },
});

// Load initial state
const initialState = loadState();
if (initialState.songs) {
  store.dispatch({ type: 'songs/initializeSongs', payload: initialState.songs });
}

// Save state to localStorage whenever it changes
store.subscribe(() => {
  saveState(store.getState());
});

export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
