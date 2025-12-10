/**
 * Default Instrument Configurations
 * Pre-loaded instruments that match the original hardcoded behavior
 */

import { InstrumentConfig } from '../types';

const DEFAULT_DATE = '2025-12-09T00:00:00.000Z';

export const DEFAULT_INSTRUMENTS: InstrumentConfig[] = [
  {
    key: 'djembe',
    name: 'Djembe',
    description: 'Hand drum with bass, tone, slap, and accent strokes',
    color: 'text-emerald-500',
    displayOrder: 0,
    availableNotes: ['.', 'B', 'T', 'S', '^'],
    cycleOrder: ['.', 'B', 'T', 'S', '^'],
    noteLabels: {
      '.': 'Rest',
      'B': 'Bass',
      'T': 'Tone',
      'S': 'Slap',
      '^': 'Accent'
    },
    noteColors: {
      '.': 'text-zinc-500',
      'B': 'text-emerald-300',
      'T': 'text-sky-300',
      'S': 'text-orange-300',
      '^': 'text-fuchsia-300'
    },
    noteSymbols: {
      '.': '·'
    },
    flamNotes: ['B', 'T', 'S', '^'], // All notes except rest can be used in flams
    created: DEFAULT_DATE,
    modified: DEFAULT_DATE
  },
  {
    key: 'sangban',
    name: 'Sangban',
    description: 'Medium dundun (bass drum) with bell',
    color: 'text-yellow-500',
    displayOrder: 1,
    availableNotes: ['.', 'O', 'M'],
    cycleOrder: ['.', 'O', 'M'],
    noteLabels: {
      '.': 'Rest',
      'O': 'Open',
      'M': 'Muted'
    },
    noteColors: {
      '.': 'text-zinc-500',
      'O': 'text-yellow-300',
      'M': 'text-gray-400'
    },
    noteSymbols: {
      '.': '·'
    },
    flamNotes: [], // Dundun instruments typically don't use flams
    created: DEFAULT_DATE,
    modified: DEFAULT_DATE
  },
  {
    key: 'kenkeni',
    name: 'Kenkeni',
    description: 'Smallest dundun (bass drum)',
    color: 'text-orange-500',
    displayOrder: 2,
    availableNotes: ['.', 'O', 'M'],
    cycleOrder: ['.', 'O', 'M'],
    noteLabels: {
      '.': 'Rest',
      'O': 'Open',
      'M': 'Muted'
    },
    noteColors: {
      '.': 'text-zinc-500',
      'O': 'text-yellow-300',
      'M': 'text-gray-400'
    },
    noteSymbols: {
      '.': '·'
    },
    flamNotes: [],
    created: DEFAULT_DATE,
    modified: DEFAULT_DATE
  },
  {
    key: 'dundunba',
    name: 'Dundunba',
    description: 'Largest dundun (bass drum)',
    color: 'text-red-500',
    displayOrder: 3,
    availableNotes: ['.', 'O', 'M'],
    cycleOrder: ['.', 'O', 'M'],
    noteLabels: {
      '.': 'Rest',
      'O': 'Open',
      'M': 'Muted'
    },
    noteColors: {
      '.': 'text-zinc-500',
      'O': 'text-yellow-300',
      'M': 'text-gray-400'
    },
    noteSymbols: {
      '.': '·'
    },
    flamNotes: [],
    created: DEFAULT_DATE,
    modified: DEFAULT_DATE
  },
  {
    key: 'kenken',
    name: 'Kenken (Bell)',
    description: 'Cowbell played with dundun',
    color: 'text-cyan-500',
    displayOrder: 4,
    availableNotes: ['.', 'O', 'M'],
    cycleOrder: ['.', 'O', 'M'],
    noteLabels: {
      '.': 'Rest',
      'O': 'Open',
      'M': 'Muted'
    },
    noteColors: {
      '.': 'text-zinc-500',
      'O': 'text-cyan-300', // Unique color for kenken (cowbell)
      'M': 'text-gray-400'
    },
    noteSymbols: {
      '.': '·'
    },
    flamNotes: [],
    created: DEFAULT_DATE,
    modified: DEFAULT_DATE
  }
];
