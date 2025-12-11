/**
 * Migration Redux Slice
 * Manages migration state including pending migrations and user choices
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MigrationAnalysis } from '../migration/migrationEngine';

export interface MigrationRecord {
  fromVersion: string;
  toVersion: string;
  timestamp: string;
  userChoice: 'accepted' | 'dismissed' | 'kept-data';
}

export interface MigrationState {
  songs: {
    pendingMigration: MigrationAnalysis | null;
    lastMigration: MigrationRecord | null;
    dismissedVersions: string[];
  };
  instruments: {
    pendingMigration: MigrationAnalysis | null;
    lastMigration: MigrationRecord | null;
    dismissedVersions: string[];
  };
  dialogOpen: boolean;
}

const initialState: MigrationState = {
  songs: {
    pendingMigration: null,
    lastMigration: null,
    dismissedVersions: []
  },
  instruments: {
    pendingMigration: null,
    lastMigration: null,
    dismissedVersions: []
  },
  dialogOpen: false
};

const migrationSlice = createSlice({
  name: 'migration',
  initialState,
  reducers: {
    // Initialize migration state from storage
    initializeMigration: (state, action: PayloadAction<Partial<MigrationState>>) => {
      return { ...state, ...action.payload };
    },

    // Set pending song migration
    setPendingSongMigration: (state, action: PayloadAction<MigrationAnalysis | null>) => {
      state.songs.pendingMigration = action.payload;
      if (action.payload && action.payload.needed) {
        state.dialogOpen = true;
      }
    },

    // Set pending instrument migration
    setPendingInstrumentMigration: (state, action: PayloadAction<MigrationAnalysis | null>) => {
      state.instruments.pendingMigration = action.payload;
      if (action.payload && action.payload.needed) {
        state.dialogOpen = true;
      }
    },

    // Record song migration completion
    recordSongMigration: (state, action: PayloadAction<MigrationRecord>) => {
      state.songs.lastMigration = action.payload;
      state.songs.pendingMigration = null;
    },

    // Record instrument migration completion
    recordInstrumentMigration: (state, action: PayloadAction<MigrationRecord>) => {
      state.instruments.lastMigration = action.payload;
      state.instruments.pendingMigration = null;
    },

    // Dismiss song version
    dismissSongVersion: (state, action: PayloadAction<string>) => {
      if (!state.songs.dismissedVersions.includes(action.payload)) {
        state.songs.dismissedVersions.push(action.payload);
      }
      state.songs.pendingMigration = null;
    },

    // Dismiss instrument version
    dismissInstrumentVersion: (state, action: PayloadAction<string>) => {
      if (!state.instruments.dismissedVersions.includes(action.payload)) {
        state.instruments.dismissedVersions.push(action.payload);
      }
      state.instruments.pendingMigration = null;
    },

    // Open/close migration dialog
    setDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.dialogOpen = action.payload;
    },

    // Clear all migration state (for testing)
    clearMigrationState: () => {
      return initialState;
    }
  }
});

export const {
  initializeMigration,
  setPendingSongMigration,
  setPendingInstrumentMigration,
  recordSongMigration,
  recordInstrumentMigration,
  dismissSongVersion,
  dismissInstrumentVersion,
  setDialogOpen,
  clearMigrationState
} = migrationSlice.actions;

export default migrationSlice.reducer;
