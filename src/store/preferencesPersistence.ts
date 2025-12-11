/**
 * Preferences Persistence
 * Handles saving and loading preferences from localStorage
 */

import { PreferencesState } from './preferencesSlice';

const PREFERENCES_STORAGE_KEY = 'drum-notation-preferences';

/**
 * Load preferences from localStorage
 */
export function loadPreferences(): Partial<PreferencesState> {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Partial<PreferencesState>;

    // Validate structure
    if (typeof parsed !== 'object') {
      console.warn('[Preferences] Invalid stored preferences');
      return {};
    }

    // Validate instrument focus is an array
    if (parsed.instrumentFocus && !Array.isArray(parsed.instrumentFocus)) {
      console.warn('[Preferences] Invalid instrumentFocus format');
      parsed.instrumentFocus = undefined;
    }

    // Ensure at least one instrument is focused
    if (parsed.instrumentFocus && parsed.instrumentFocus.length === 0) {
      console.warn('[Preferences] Empty instrumentFocus, using default');
      parsed.instrumentFocus = ['djembe'];
    }

    return parsed;
  } catch (error) {
    console.error('[Preferences] Error loading preferences:', error);
    return {};
  }
}

/**
 * Save preferences to localStorage
 */
export function savePreferences(state: PreferencesState): void {
  try {
    const serialized = JSON.stringify({
      version: state.version,
      instrumentFocus: state.instrumentFocus
    });
    localStorage.setItem(PREFERENCES_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('[Preferences] Error saving preferences:', error);
  }
}

/**
 * Clear preferences from localStorage
 */
export function clearPreferences(): void {
  try {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  } catch (error) {
    console.error('[Preferences] Error clearing preferences:', error);
  }
}
