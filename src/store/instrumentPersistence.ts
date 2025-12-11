/**
 * Instrument Persistence Layer
 * Handles loading and saving instrument configurations from/to localStorage
 */

import { InstrumentConfig } from '../types';
import { DEFAULT_INSTRUMENTS } from '../assets/defaultInstruments';
import { validateInstrumentConfig } from '../utils/instrumentValidation';
import { INSTRUMENTS_SCHEMA_VERSION } from '../config/schemaVersions';

const INSTRUMENTS_STORAGE_KEY = 'drum-notation-instruments';
const INSTRUMENTS_VERSION = INSTRUMENTS_SCHEMA_VERSION;

export interface InstrumentsStorageState {
  version: string;
  instruments: InstrumentConfig[];
}

/**
 * Load instruments from localStorage
 * If not found or invalid, returns default instruments
 */
export function loadInstruments(): InstrumentsStorageState {
  try {
    const stored = localStorage.getItem(INSTRUMENTS_STORAGE_KEY);

    if (!stored) {
      // First time - return defaults
      return {
        version: INSTRUMENTS_VERSION,
        instruments: DEFAULT_INSTRUMENTS
      };
    }

    const parsed = JSON.parse(stored) as InstrumentsStorageState;

    // Validate the stored data
    if (!parsed.instruments || !Array.isArray(parsed.instruments)) {
      console.warn('[Instruments] Invalid stored data, falling back to defaults');
      return {
        version: INSTRUMENTS_VERSION,
        instruments: DEFAULT_INSTRUMENTS
      };
    }

    // Validate each instrument config
    const validInstruments = parsed.instruments.filter(instrument => {
      const validation = validateInstrumentConfig(instrument);
      if (!validation.valid) {
        console.warn(`[Instruments] Invalid instrument "${instrument.key}":`, validation.errors);
        return false;
      }
      return true;
    });

    // If no valid instruments, fall back to defaults
    if (validInstruments.length === 0) {
      console.warn('[Instruments] No valid instruments found, using defaults');
      return {
        version: INSTRUMENTS_VERSION,
        instruments: DEFAULT_INSTRUMENTS
      };
    }

    // Merge with defaults if needed (for future schema updates)
    const merged = mergeWithDefaults(validInstruments);

    return {
      version: parsed.version || INSTRUMENTS_VERSION,
      instruments: merged
    };
  } catch (error) {
    console.error('[Instruments] Error loading instruments:', error);
    return {
      version: INSTRUMENTS_VERSION,
      instruments: DEFAULT_INSTRUMENTS
    };
  }
}

/**
 * Save instruments to localStorage
 */
export function saveInstruments(state: InstrumentsStorageState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(INSTRUMENTS_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('[Instruments] Error saving instruments:', error);
  }
}

/**
 * Merge saved instruments with defaults
 * This allows us to update default instruments while preserving user customizations
 *
 * Strategy:
 * - For now, just return the saved instruments as-is
 * - In future, we could check if default instruments have updates and merge them
 */
function mergeWithDefaults(saved: InstrumentConfig[]): InstrumentConfig[] {
  // For v1.0.0, no merging needed - just return saved instruments
  // Users can manually re-import defaults if needed
  return saved;
}

/**
 * Export a single instrument as JSON
 */
export function exportInstrument(instrument: InstrumentConfig): string {
  return JSON.stringify(instrument, null, 2);
}

/**
 * Export all instruments as JSON
 */
export function exportAllInstruments(instruments: InstrumentConfig[]): string {
  return JSON.stringify({ instruments, version: INSTRUMENTS_VERSION }, null, 2);
}

/**
 * Parse and validate imported instrument JSON
 */
export function importInstrumentFromJSON(json: string): { success: boolean; instrument?: InstrumentConfig; error?: string } {
  try {
    const parsed = JSON.parse(json);

    // Could be a single instrument or a collection
    const instrument = parsed.instruments ? parsed.instruments[0] : parsed;

    if (!instrument) {
      return { success: false, error: 'No instrument data found in JSON' };
    }

    const validation = validateInstrumentConfig(instrument);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid instrument: ${validation.errors.join(', ')}`
      };
    }

    return { success: true, instrument };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Reset instruments to defaults
 */
export function resetToDefaults(): InstrumentsStorageState {
  const state = {
    version: INSTRUMENTS_VERSION,
    instruments: DEFAULT_INSTRUMENTS
  };
  saveInstruments(state);
  return state;
}
