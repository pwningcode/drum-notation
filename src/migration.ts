/**
 * Migration utilities to convert legacy song data to new format
 */

import {
  Song,
  Section,
  Measure,
  LegacySongData,
  LegacySection,
  LegacyMeasure,
  LegacyTimeSignature,
  generateId,
  DivisionType,
  DjembeNote
} from './types';

/**
 * Migrates a legacy song to the new format
 */
export function migrateLegacySong(legacySong: LegacySongData): Song {
  const now = new Date().toISOString();

  return {
    id: generateId(),
    title: legacySong.title,
    tempo: 120, // default tempo
    sections: [
      // Convert intro
      createSectionFromLegacy('Intro', legacySong.intro, legacySong.timeSig),

      // Convert variants
      ...legacySong.variants.map((variant, idx) =>
        createSectionFromLegacy(`Variant ${idx + 1}`, variant, legacySong.timeSig)
      ),

      // Convert outro
      createSectionFromLegacy('Outro', legacySong.outro, legacySong.timeSig)
    ],
    created: now,
    modified: now
  };
}

/**
 * Creates a new section from legacy format
 */
function createSectionFromLegacy(
  name: string,
  legacyMeasures: LegacySection,
  timeSig: LegacyTimeSignature
): Section {
  return {
    id: generateId(),
    name,
    measures: legacyMeasures.map(legacyMeasure =>
      createMeasureFromLegacy(legacyMeasure, timeSig)
    )
  };
}

/**
 * Creates a new measure from legacy format
 */
function createMeasureFromLegacy(
  legacyMeasure: LegacyMeasure,
  timeSig: LegacyTimeSignature
): Measure {
  const divisionType: DivisionType = timeSig.subdivisions === 3 ? 'triplet' : 'sixteenth';

  return {
    id: generateId(),
    timeSignature: {
      beats: timeSig.beats,
      division: timeSig.division || 4,
      divisionType
    },
    tracks: [
      {
        id: generateId(),
        instrument: 'djembe',
        notes: legacyMeasure.map(note => note as DjembeNote)
      }
    ]
  };
}

/**
 * Migrates multiple legacy songs
 */
export function migrateLegacySongs(legacySongs: LegacySongData[]): Song[] {
  return legacySongs.map(migrateLegacySong);
}

/**
 * Converts a new song back to legacy format (for backwards compatibility)
 * Note: This loses some information (additional tracks, flams, etc.)
 */
export function convertToLegacyFormat(song: Song): LegacySongData {
  // Find intro, variants, and outro sections
  const intro = song.sections.find(s => s.name === 'Intro');
  const outro = song.sections.find(s => s.name === 'Outro');
  const variants = song.sections.filter(s => s.name.startsWith('Variant'));

  // Use first section if no intro found
  const introSection = intro || song.sections[0];
  const outroSection = outro || song.sections[song.sections.length - 1];

  // Get time signature from first measure of first section
  const firstMeasure = introSection?.measures[0];
  const timeSig: LegacyTimeSignature = firstMeasure ? {
    beats: firstMeasure.timeSignature.beats ?? 4,
    division: firstMeasure.timeSignature.division ?? 4,
    subdivisions: firstMeasure.timeSignature.divisionType === 'triplet' ? 3 : 4
  } : {
    beats: 4,
    division: 4,
    subdivisions: 4
  };

  return {
    title: song.title,
    timeSig,
    intro: sectionToLegacySection(introSection),
    variants: variants.map(sectionToLegacySection),
    outro: sectionToLegacySection(outroSection)
  };
}

/**
 * Converts a section to legacy format
 */
function sectionToLegacySection(section: Section | undefined): LegacySection {
  if (!section) {
    return [[]];
  }

  return section.measures.map(measure => {
    // Take only the first track and convert to legacy format
    const firstTrack = measure.tracks[0];
    if (!firstTrack) {
      return [];
    }

    // Convert notes, stripping flams to just main note
    return firstTrack.notes.map(note => {
      if (typeof note === 'object' && note !== null && 'type' in note && note.type === 'flam') {
        return note.main;
      }
      return note as DjembeNote;
    });
  });
}

/**
 * Checks if data is in legacy format
 */
export function isLegacyFormat(data: any): data is LegacySongData {
  return (
    data &&
    typeof data === 'object' &&
    'title' in data &&
    'timeSig' in data &&
    'intro' in data &&
    'variants' in data &&
    'outro' in data &&
    !('sections' in data)
  );
}

/**
 * Validates that a song has the correct structure
 */
export function validateSong(song: any): song is Song {
  return (
    song &&
    typeof song === 'object' &&
    'id' in song &&
    'title' in song &&
    'tempo' in song &&
    'sections' in song &&
    Array.isArray(song.sections)
  );
}

/**
 * Migrates a song to support multi-cycle format.
 * Adds visualGrid to measures and cycleLength/startOffset to tracks.
 * This is a non-destructive migration - all existing data is preserved.
 */
export function migrateToMultiCycle(song: Song): Song {
  return {
    ...song,
    sections: song.sections.map(section => ({
      ...section,
      measures: section.measures.map(measure => {
        // Calculate default grid size from time signature
        const subdivisions = measure.timeSignature.divisionType === 'triplet' ? 3 : 4;
        const defaultGridSize = (measure.timeSignature.beats ?? 4) * subdivisions;

        return {
          ...measure,
          // Add visualGrid if not present
          visualGrid: measure.visualGrid ?? {
            pulses: defaultGridSize,
            pulsesPerBeat: subdivisions,
            showCycleGuides: false,
          },
          tracks: measure.tracks.map(track => ({
            ...track,
            // Add cycle properties if not present
            cycleLength: track.cycleLength ?? track.notes.length,
            startOffset: track.startOffset ?? 0,
          })),
        };
      }),
    })),
  };
}

/**
 * Migrates multiple songs to multi-cycle format
 */
export function migrateAllToMultiCycle(songs: Song[]): Song[] {
  return songs.map(migrateToMultiCycle);
}
