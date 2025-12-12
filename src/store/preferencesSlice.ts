/**
 * Preferences Redux Slice
 * Manages user preferences including instrument focus
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PreferencesState {
  version: string;
  instrumentFocus: string[];  // Array of InstrumentKeys user wants to focus on
  lastUsedCycles?: Record<string, number>;  // Track last-used cycle length per instrument
  westernNotation: {  // Western notation display preferences
    enabled: boolean;
    showBeatGroupings: boolean;
    showSubdivisionLabels: boolean;
    showTimeSignature: boolean;
    cycleGuideStyle: 'subtle' | 'moderate' | 'strong' | 'maximum';
  };
}

const initialState: PreferencesState = {
  version: '1.0.0',
  instrumentFocus: ['djembe'],  // Default for backward compatibility
  lastUsedCycles: {},  // Empty by default, will be populated as user sets cycles
  westernNotation: {  // OFF by default for new users (cycles-first approach)
    enabled: false,
    showBeatGroupings: true,
    showSubdivisionLabels: true,
    showTimeSignature: true,
    cycleGuideStyle: 'strong',
  },
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    // Initialize preferences from storage
    initializePreferences: (state, action: PayloadAction<Partial<PreferencesState>>) => {
      return { ...state, ...action.payload };
    },

    // Set instrument focus (array of instrument keys)
    setInstrumentFocus: (state, action: PayloadAction<string[]>) => {
      // Ensure at least one instrument is focused
      if (action.payload.length === 0) {
        console.warn('[Preferences] Cannot set empty instrument focus, defaulting to djembe');
        state.instrumentFocus = ['djembe'];
      } else {
        state.instrumentFocus = action.payload;
      }
    },

    // Toggle a single instrument in focus
    toggleInstrumentFocus: (state, action: PayloadAction<string>) => {
      const instrumentKey = action.payload;
      const index = state.instrumentFocus.indexOf(instrumentKey);

      if (index !== -1) {
        // Remove from focus (only if not the last one)
        if (state.instrumentFocus.length > 1) {
          state.instrumentFocus.splice(index, 1);
        } else {
          console.warn('[Preferences] Cannot remove last focused instrument');
        }
      } else {
        // Add to focus
        state.instrumentFocus.push(instrumentKey);
      }
    },

    // Update last used cycle length for an instrument
    setLastUsedCycle: (state, action: PayloadAction<{ instrument: string; cycleLength: number }>) => {
      if (!state.lastUsedCycles) {
        state.lastUsedCycles = {};
      }
      state.lastUsedCycles[action.payload.instrument] = action.payload.cycleLength;
    },

    // Toggle Western notation on/off
    toggleWesternNotation: (state) => {
      state.westernNotation.enabled = !state.westernNotation.enabled;
    },

    // Update Western notation options
    setWesternNotationOptions: (state, action: PayloadAction<Partial<PreferencesState['westernNotation']>>) => {
      state.westernNotation = { ...state.westernNotation, ...action.payload };
    },

    // Set cycle guide style
    setCycleGuideStyle: (state, action: PayloadAction<'subtle' | 'moderate' | 'strong' | 'maximum'>) => {
      state.westernNotation.cycleGuideStyle = action.payload;
    },

    // Reset preferences to defaults
    resetPreferences: () => {
      return initialState;
    },

    // Clear all preferences (for testing)
    clearPreferences: () => {
      return initialState;
    }
  }
});

export const {
  initializePreferences,
  setInstrumentFocus,
  toggleInstrumentFocus,
  setLastUsedCycle,
  toggleWesternNotation,
  setWesternNotationOptions,
  setCycleGuideStyle,
  resetPreferences,
  clearPreferences
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
