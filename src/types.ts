/**
 * Drum Notation - Type Definitions
 * Expanded data structure to support multiple instruments, flams, and flexible sections
 */

// ============================================================================
// Instrument and Note Types
// ============================================================================

export type InstrumentType = 'djembe' | 'sangban' | 'kenkeni' | 'dundunba' | 'kenken';

export type DjembeNote =
  | '.'      // rest
  | 'B'      // bass
  | 'T'      // tone
  | 'S'      // slap
  | '^';     // accent

export type DunDunNote =
  | '.'      // rest
  | 'O'      // open/regular
  | 'M';     // muted

// Flam support - grace note + main note
// Open flams have more space between grace and main note
export interface FlamType {
  type: 'flam';
  grace: DjembeNote;  // grace note (cannot be rest or accent)
  main: DjembeNote;   // main note (cannot be rest)
  open?: boolean;     // true for open flam, false/undefined for closed flam
}

export type Note = DjembeNote | DunDunNote | FlamType | '.';

// ============================================================================
// Division and Time Signature Types
// ============================================================================

export type DivisionType =
  | 'sixteenth'   // 16th notes (4 subdivisions per beat)
  | 'triplet'     // triplets (3 subdivisions per beat)
  | 'mixed';      // allows different divisions within same measure (future feature)

export interface TimeSignature {
  beats: number;               // 2, 3, 4, etc.
  division: number;            // always 4 for x/4 time
  divisionType: DivisionType;  // sixteenth, triplet, or mixed
}

// ============================================================================
// Track and Measure Types
// ============================================================================

// Instrument track - single instrument line within a measure
export interface InstrumentTrack {
  id: string;                    // unique identifier
  instrument: InstrumentType;
  notes: Note[];                 // length = beats * subdivisions
  label?: string;                // optional label like "Solo 1", "Part A"
}

// Measure - can contain multiple instrument tracks stacked vertically
export interface Measure {
  id: string;
  timeSignature: TimeSignature;
  tracks: InstrumentTrack[];     // multiple instruments stacked
}

// ============================================================================
// Section and Song Types
// ============================================================================

// Section - named section with tempo
export interface Section {
  id: string;
  name: string;                  // "Intro", "Break", "Solo Section", etc.
  tempo?: number;                // BPM for this section (overrides song default)
  measures: Measure[];
  variants?: Section[];          // variants/solos nested within section
}

// Song
export interface Song {
  id: string;
  title: string;
  description?: string;          // optional song description/notes
  tempo: number;                 // default BPM for entire song
  sections: Section[];           // flexible sections instead of fixed intro/variants/outro
  created: string;               // ISO date
  modified: string;              // ISO date
}

// ============================================================================
// Legacy Types (for migration)
// ============================================================================

export type LegacySubdivision = '.' | 'B' | 'T' | 'S' | '^';
export type LegacyMeasure = LegacySubdivision[];
export type LegacySection = LegacyMeasure[];

export interface LegacyTimeSignature {
  beats: number;
  division: number;
  subdivisions?: number;
}

export interface LegacySongData {
  title: string;
  timeSig: LegacyTimeSignature;
  intro: LegacySection;
  variants: LegacySection[];
  outro: LegacySection;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isFlam(note: Note): note is FlamType {
  return typeof note === 'object' && note !== null && 'type' in note && note.type === 'flam';
}

export function isDjembeNote(note: Note): note is DjembeNote {
  return typeof note === 'string' && ['.', 'B', 'T', 'S', '^'].includes(note);
}

export function isDunDunNote(note: Note): note is DunDunNote {
  return typeof note === 'string' && ['.', 'O', 'M'].includes(note);
}

export function getSubdivisionsPerBeat(divisionType: DivisionType): number {
  switch (divisionType) {
    case 'triplet': return 3;
    case 'sixteenth': return 4;
    case 'mixed': return 4; // default for mixed, actual subdivision may vary per beat
  }
}

export function formatFlam(flam: FlamType): string {
  // Display as lowercase grace note + main note
  // Open flams use a dash separator (t-S), closed flams have no separator (tS)
  const graceSymbol = flam.grace.toLowerCase();
  const separator = flam.open ? '-' : '';
  return `${graceSymbol}${separator}${flam.main}`;
}
