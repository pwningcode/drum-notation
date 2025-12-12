# Supporting Multiple Instrument Cycles

This note outlines how to extend the app so each instrument can use its own cycle length (pulse count) while still aligning visually and aurally. The goal is to let parts with different feels—e.g., 12-pulse bell timelines vs. 16-pulse dunun phrases—stack cleanly so students can see and hear how they interlock.

## Core ideas

1. **Global pulse grid**
   * Keep a single high-resolution pulse grid (the lowest common multiple of all instrument pulse counts, or a configurable subdivision like 24 or 48 PPQN) as the app’s master time axis.
   * Every instrument’s cycle and note timing map to this grid, which preserves alignment while allowing independent phrase lengths.

2. **Instrument cycles (local pulse counts)**
   * Each instrument defines its own `cycleLength` (number of pulses before it repeats) and an optional `feel` (e.g., 12-pulse triplet feel vs. 16-pulse straight feel).
   * Notes are stored relative to the instrument’s cycle (0–`cycleLength`), then translated to the global grid for rendering/playback.

3. **Anchors and start offsets**
   * Allow an instrument to specify a `startOffset` (in global pulses) so phrases can start after a bell hit or dancer cue.
   * Optionally allow **swing/feel curves** per instrument to nudge playback timing without changing the underlying grid.

4. **Cycle mapping helper**
   * Provide utilities to convert `(instrumentCycleIndex, instrumentCycleLength)` → `globalPulseIndex` using a shared `pulsesPerQuarter` or global grid size.
   * Handle wrapping so long phrases can span multiple global cycles.

5. **Shared markers**
   * Represent bell timelines or dance steps as **global markers** on the pulse grid. Instruments reference these markers for teaching (e.g., “enter after bell 3”).

## Data model sketch

```ts
// Global settings
interface TimelineSettings {
  pulsesPerQuarter: number; // base resolution for global grid
  displayGrid: number;      // optional: how many pulses to show as one UI column
}

interface InstrumentPart {
  id: string;
  name: string;
  cycleLength: number; // instrument-local pulses per cycle
  startOffset: number; // in global pulses
  notes: Note[];       // positions 0..cycleLength-1
  feel?: 'straight' | 'triplet' | 'custom';
  swingRatio?: number; // optional timing humanization
}

interface Note {
  position: number; // instrument-local pulse index
  velocity?: number;
  articulation?: 'tone' | 'slap' | 'bass' | 'muted';
}

interface Marker {
  label: string;        // e.g., bell hit #3
  pulseIndex: number;   // global pulse position
}
```

## Rendering strategy

* **Primary axis = global pulses.** Build the grid columns from the global pulse count for the current view length.
* **Per-instrument rows** map their note positions onto the global axis via the cycle mapping helper.
* **Cycle guides.** Draw light vertical lines where each instrument completes a cycle to visualize overlaps (e.g., dunun 16-pulse bars against a 12-pulse bell).
* **Markers** (bell hits, dance steps) render on the global axis so learners see where entries land.

## Playback strategy

* Use a **single transport clock** ticking at the global pulse rate.
* For each tick, trigger any notes whose mapped global pulse matches the tick.
* For swing/feel, apply per-instrument micro-timing offsets when scheduling audio events (without altering the stored grid positions).

## Authoring UX suggestions

* Let users pick a **cycle preset** when adding an instrument: 12, 16, 24, or custom pulse counts.
* Provide a **“align to marker”** action to set an instrument’s `startOffset` based on a selected bell hit.
* Offer a **cycle overlay** toggle to show each instrument’s cycle boundaries.
* Display **relative counts** (1–12, 1–16) in each row instead of only global counts to mirror how drummers think.

## Migration path

1. Introduce the global pulse grid setting (default to current beats×divisions to remain backward compatible).
2. Extend instrument parts with `cycleLength` and `startOffset`; migrate existing parts by setting `cycleLength = beats × divisions` and `startOffset = 0`.
3. Add the cycle mapping helper used by both renderer and playback engine.
4. Update UI to render per-instrument cycle guides and optional markers.
5. Add tests for mapping correctness (e.g., 12- vs. 16-pulse layering) and for backward-compatible playback.

## Acceptance checks

* A 12-pulse bell pattern and a 16-pulse dunun phrase both render on a shared grid, repeating independently yet visually aligned.
* Changing an instrument’s `startOffset` shifts its pattern relative to the bell without affecting other instruments.
* Existing single-time-signature charts load unchanged and play identically.
