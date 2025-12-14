/**
 * Drum Notation - Type Definitions
 * Expanded data structure to support multiple instruments, flams, and flexible sections
 */

// ============================================================================
// Instrument and Note Types
// ============================================================================

// Legacy type - kept for backward compatibility during migration
export type InstrumentType = 'djembe' | 'sangban' | 'kenkeni' | 'dundunba' | 'kenken';

// New flexible instrument key type
export type InstrumentKey = string;

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

export type Feel =
  | 'straight'    // straight/even feel (default)
  | 'swing'       // swing feel
  | 'half-time'   // half-time feel
  | 'double-time'; // double-time feel

export interface TimeSignature {
  divisionType: DivisionType;  // sixteenth (1 e & a), triplet (1 la le), or mixed
  feel?: Feel;                 // optional feel/groove (straight, swing, shuffle, etc.)
}

// ============================================================================
// Track and Measure Types
// ============================================================================

// Instrument track - single instrument line within a measure
export interface InstrumentTrack {
  id: string;                    // unique identifier
  instrument: InstrumentKey;     // instrument key (references InstrumentConfig)
  notes: Note[];                 // length = cycleLength (cycle mode) or full grid size (individual mode)
  label?: string;                // optional label like "Solo 1", "Part A"
  visible?: boolean;             // track visibility (undefined = true for backward compatibility)
  cycleLength?: number;          // pulses in this track's cycle (defaults to notes.length for backward compatibility)
  startOffset?: number;          // start position in measure grid (default: 0)
  cycleEditingEnabled?: boolean; // if true (default), editing applies to all cycle repetitions; if false, edit individual notes
}

// Measure - can contain multiple instrument tracks stacked vertically
export interface Measure {
  id: string;
  timeSignature: TimeSignature;
  tracks: InstrumentTrack[];     // multiple instruments stacked
  notes?: string;                // optional notes/description for this measure
  visualGrid?: {                 // visual grid configuration for multi-cycle support
    pulses: number;              // total pulses to display (e.g., 48 for LCM of 12 and 16)
    pulsesPerBeat?: number;      // grouping for display (default: 4 for 16th feel)
    showCycleGuides?: boolean;   // show visual cycle boundary markers
    locked?: boolean;            // prevents automatic LCM recalculation
  };
}

// ============================================================================
// Section and Song Types
// ============================================================================

// Section - named section with tempo
export interface Section {
  id: string;
  name: string;                  // "Intro", "Break", "Solo Section", etc.
  tempo?: number;                // BPM for this section (overrides song default)
  notes?: string;                // optional notes/description for this section
  measures: Measure[];
  variants?: Section[];          // variants/solos nested within section
}

// Song
export interface Song {
  id: string;
  title: string;
  description?: string;          // optional song description/notes
  tempo: number;                 // default BPM for entire song
  links?: string[];              // optional list of URLs/links related to the song
  displayOrder?: number;         // optional display order (for sorting in UI)
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
// Instrument Configuration (Dynamic Instruments)
// ============================================================================

export interface InstrumentConfig {
  key: string;                          // Unique identifier used in song data (e.g., 'djembe')
  name: string;                         // Display name (e.g., 'Djembe', 'Sangban')
  description?: string;                 // Optional description for help/docs
  color?: string;                       // Instrument color (Tailwind class, e.g., 'text-emerald-500')
  displayOrder: number;                 // Sort order for display (lower = earlier)
  availableNotes: string[];             // All possible note characters (e.g., ['.', 'B', 'T', 'S', '^'])
  cycleOrder: string[];                 // Order for click-cycling (e.g., ['.', 'B', 'T', 'S', '^'])
  noteLabels: Record<string, string>;   // Note → label mapping (e.g., {'B': 'Bass', 'T': 'Tone'})
  noteColors: Record<string, string>;   // Note → Tailwind class (e.g., {'B': 'text-emerald-300'})
  noteSymbols?: Record<string, string>; // Optional custom symbols (e.g., {'.': '·'})
  flamNotes: string[];                  // Notes that can be used in flams (subset of availableNotes)
  created: string;                      // ISO date
  modified: string;                     // ISO date
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

// ============================================================================
// Multi-Cycle Support Helper Functions
// ============================================================================

/**
 * Get the visual grid size for a measure.
 * Returns visualGrid.pulses or defaults to 16 pulses (4/4 with sixteenths).
 */
export function getMeasureGridSize(measure: Measure): number {
  if (measure.visualGrid) {
    return measure.visualGrid.pulses;
  }
  // Default fallback: 16 pulses (4/4 with sixteenths)
  return 16;
}

/**
 * Get the effective cycle length for a track.
 * Falls back to notes.length for backward compatibility.
 */
export function getTrackCycleLength(track: InstrumentTrack): number {
  return track.cycleLength ?? track.notes.length;
}

/**
 * Map track cycle position to measure grid position.
 */
export function mapCycleToGrid(cycleIndex: number, track: InstrumentTrack): number {
  const startOffset = track.startOffset ?? 0;
  return startOffset + cycleIndex;
}

/**
 * Map measure grid position to track cycle position (for editing).
 * Returns null if the grid position is outside the track's active range.
 */
export function mapGridToCycle(gridIndex: number, track: InstrumentTrack): number | null {
  const cycleLength = getTrackCycleLength(track);
  const startOffset = track.startOffset ?? 0;
  const relativePos = gridIndex - startOffset;

  if (relativePos < 0) return null;  // Before track starts

  return relativePos % cycleLength;
}

/**
 * Calculate the least common multiple (LCM) of two numbers.
 */
export function calculateLCM(a: number, b: number): number {
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
  return (a * b) / gcd(a, b);
}

/**
 * Auto-calculate visual grid size from all track cycles using LCM.
 */
export function calculateMeasureGridSize(tracks: InstrumentTrack[]): number {
  if (tracks.length === 0) return 16; // Default

  let lcm = getTrackCycleLength(tracks[0]);
  for (let i = 1; i < tracks.length; i++) {
    lcm = calculateLCM(lcm, getTrackCycleLength(tracks[i]));
  }

  return lcm;
}
