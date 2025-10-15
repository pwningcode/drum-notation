import { configureStore } from '@reduxjs/toolkit';
import songsReducer from './songsSlice';
import { loadState, saveState } from './persistence';

export const store = configureStore({
  reducer: {
    songs: songsReducer,
  },
  preloadedState: loadState(),
});

// Save state to localStorage whenever it changes
store.subscribe(() => {
  saveState(store.getState());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
