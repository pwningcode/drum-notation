/**
 * Instrument Configuration Validation Utilities
 */

import { InstrumentConfig, Song } from '../types';

/**
 * Validates that a character is safe for use as a note character
 * Allows printable ASCII and common Unicode characters
 */
export function validateNoteCharacter(char: string): boolean {
  if (char.length !== 1) return false;

  const code = char.charCodeAt(0);
  // Allow printable ASCII (33-126) and common Unicode (128-65535)
  // Exclude control characters and potentially problematic chars
  return (code >= 33 && code <= 126) || (code >= 128 && code <= 65535);
}

/**
 * Validates that a cycle order includes all available notes
 */
export function validateCycleOrder(config: InstrumentConfig): boolean {
  const availableSet = new Set(config.availableNotes);
  const cycleSet = new Set(config.cycleOrder);

  // Cycle must include all available notes exactly once
  if (availableSet.size !== cycleSet.size) return false;

  return [...availableSet].every(note => cycleSet.has(note));
}

/**
 * Validates that a color class is a reasonable Tailwind class
 * Basic validation - just checks it starts with 'text-'
 */
export function validateColorClass(className: string): boolean {
  return typeof className === 'string' && className.startsWith('text-');
}

/**
 * Validates that an instrument key is alphanumeric with hyphens/underscores
 */
export function validateInstrumentKey(key: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(key);
}

/**
 * Validates that flamNotes are a subset of availableNotes
 */
export function validateFlamNotes(config: InstrumentConfig): boolean {
  const availableSet = new Set(config.availableNotes);
  return config.flamNotes.every(note => availableSet.has(note));
}

/**
 * Comprehensive validation of an instrument configuration
 */
export function validateInstrumentConfig(config: InstrumentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate key
  if (!config.key || !validateInstrumentKey(config.key)) {
    errors.push('Instrument key must be alphanumeric with optional hyphens/underscores');
  }

  // Validate name
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Instrument name is required');
  }

  // Validate available notes
  if (!config.availableNotes || config.availableNotes.length === 0) {
    errors.push('At least one note must be defined');
  } else {
    // Check for duplicate notes
    const noteSet = new Set(config.availableNotes);
    if (noteSet.size !== config.availableNotes.length) {
      errors.push('Duplicate notes found in availableNotes');
    }

    // Validate each note character
    config.availableNotes.forEach(note => {
      if (!validateNoteCharacter(note)) {
        errors.push(`Invalid note character: "${note}"`);
      }
    });
  }

  // Validate cycle order
  if (!config.cycleOrder || config.cycleOrder.length === 0) {
    errors.push('Cycle order cannot be empty');
  } else if (!validateCycleOrder(config)) {
    errors.push('Cycle order must include all available notes exactly once');
  }

  // Validate note labels
  if (!config.noteLabels || Object.keys(config.noteLabels).length === 0) {
    errors.push('At least one note label must be defined');
  }

  // Validate note colors
  if (!config.noteColors || Object.keys(config.noteColors).length === 0) {
    errors.push('At least one note color must be defined');
  } else {
    Object.entries(config.noteColors).forEach(([note, color]) => {
      if (!validateColorClass(color)) {
        errors.push(`Invalid color class for note "${note}": ${color}`);
      }
    });
  }

  // Validate flam notes
  if (config.flamNotes && !validateFlamNotes(config)) {
    errors.push('Flam notes must be a subset of available notes');
  }

  // Validate dates
  if (!config.created) {
    errors.push('Created date is required');
  }
  if (!config.modified) {
    errors.push('Modified date is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks if an instrument is used in any songs
 * Returns true if the instrument key appears in any track
 */
export function isInstrumentUsedInSongs(key: string, songs: Song[]): boolean {
  return songs.some(song =>
    song.sections.some(section =>
      section.measures.some(measure =>
        measure.tracks.some(track => track.instrument === key)
      )
    )
  );
}

/**
 * Finds all songs that use a particular instrument
 */
export function findSongsUsingInstrument(key: string, songs: Song[]): Song[] {
  return songs.filter(song =>
    song.sections.some(section =>
      section.measures.some(measure =>
        measure.tracks.some(track => track.instrument === key)
      )
    )
  );
}
