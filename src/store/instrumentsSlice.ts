import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InstrumentConfig } from '../types';
import { DEFAULT_INSTRUMENTS } from '../assets/defaultInstruments';

export interface InstrumentsState {
  instruments: InstrumentConfig[];
  version: string;
}

const initialState: InstrumentsState = {
  instruments: [],
  version: '1.0.0',
};

const instrumentsSlice = createSlice({
  name: 'instruments',
  initialState,
  reducers: {
    // Initialize instruments from storage or defaults
    initializeInstruments: (state, action: PayloadAction<{ instruments: InstrumentConfig[]; version: string }>) => {
      state.instruments = action.payload.instruments;
      state.version = action.payload.version;
    },

    // Add a new instrument
    addInstrument: (state, action: PayloadAction<InstrumentConfig>) => {
      const now = new Date().toISOString();
      const newInstrument: InstrumentConfig = {
        ...action.payload,
        created: now,
        modified: now
      };
      state.instruments.push(newInstrument);
    },

    // Update an existing instrument
    updateInstrument: (state, action: PayloadAction<{ key: string; updates: Partial<InstrumentConfig> }>) => {
      const instrument = state.instruments.find(i => i.key === action.payload.key);
      if (instrument) {
        Object.assign(instrument, action.payload.updates);
        instrument.modified = new Date().toISOString();
      }
    },

    // Remove an instrument by key
    removeInstrument: (state, action: PayloadAction<string>) => {
      const index = state.instruments.findIndex(i => i.key === action.payload);
      if (index !== -1) {
        state.instruments.splice(index, 1);
      }
    },

    // Import an instrument (adds or replaces)
    importInstrument: (state, action: PayloadAction<InstrumentConfig>) => {
      const existingIndex = state.instruments.findIndex(i => i.key === action.payload.key);
      const now = new Date().toISOString();

      if (existingIndex !== -1) {
        // Replace existing instrument
        state.instruments[existingIndex] = {
          ...action.payload,
          modified: now
        };
      } else {
        // Add new instrument
        state.instruments.push({
          ...action.payload,
          created: action.payload.created || now,
          modified: now
        });
      }
    },

    // Replace all instruments (used during import/reset)
    replaceInstruments: (state, action: PayloadAction<InstrumentConfig[]>) => {
      state.instruments = action.payload;
    },

    // Reorder instruments (drag and drop)
    reorderInstruments: (state, action: PayloadAction<InstrumentConfig[]>) => {
      // Update displayOrder based on new array order
      action.payload.forEach((instrument, index) => {
        const existing = state.instruments.find(i => i.key === instrument.key);
        if (existing) {
          existing.displayOrder = index;
        }
      });
      // Sort instruments by displayOrder
      state.instruments.sort((a, b) => a.displayOrder - b.displayOrder);
    },

    // Reset all instruments to defaults
    resetToDefaults: (state) => {
      state.instruments = DEFAULT_INSTRUMENTS;
    },
  },
});

export const {
  initializeInstruments,
  addInstrument,
  updateInstrument,
  removeInstrument,
  importInstrument,
  replaceInstruments,
  reorderInstruments,
  resetToDefaults,
} = instrumentsSlice.actions;

export default instrumentsSlice.reducer;
