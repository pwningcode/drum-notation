import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Song,
  Section,
  Measure,
  InstrumentTrack,
  Note,
  InstrumentKey,
  TimeSignature,
  generateId,
  getSubdivisionsPerBeat
} from '../types';
import { loadDefaultSongs } from './persistence';

export interface SongsState {
  songs: Song[];
  version: string;
  activeSongId: string;
}

const initialState: SongsState = {
  songs: [],
  version: '2.1.0',
  activeSongId: '',
};

const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    // Initialize songs from storage or defaults
    initializeSongs: (state, action: PayloadAction<{ songs: Song[]; version: string }>) => {
      state.songs = action.payload.songs;
      state.version = action.payload.version;
      if (action.payload.songs.length > 0 && !state.activeSongId) {
        state.activeSongId = action.payload.songs[0].id;
      }
    },

    // Set songs (for migrations)
    setSongs: (state, action: PayloadAction<Song[]>) => {
      state.songs = action.payload;
      if (action.payload.length > 0 && !state.activeSongId) {
        state.activeSongId = action.payload[0].id;
      }
    },

    // Set active song by ID
    setActiveSong: (state, action: PayloadAction<string>) => {
      state.activeSongId = action.payload;
    },

    // Add a new song (or import a complete song)
    addSong: (state, action: PayloadAction<Partial<Song> & { title: string; focusedInstruments?: string[] }>) => {
      const now = new Date().toISOString();
      const maxDisplayOrder = Math.max(0, ...state.songs.map(s => s.displayOrder ?? 0));

      // If this looks like a complete imported song, use it directly
      if (action.payload.id && action.payload.sections && action.payload.created) {
        const importedSong: Song = {
          ...action.payload as Song,
          displayOrder: action.payload.displayOrder ?? maxDisplayOrder + 1,
          modified: now
        };
        state.songs.push(importedSong);
        state.activeSongId = importedSong.id;
      } else {
        // Create a new song from scratch
        const focusedInstruments = action.payload.focusedInstruments && action.payload.focusedInstruments.length > 0
          ? action.payload.focusedInstruments
          : ['djembe'];  // Fallback to djembe if no focused instruments

        const newSong: Song = {
          id: generateId(),
          title: action.payload.title,
          description: action.payload.description,
          tempo: action.payload.tempo || 120,
          displayOrder: maxDisplayOrder + 1,
          sections: [
            {
              id: generateId(),
              name: 'Intro',
              measures: [{
                id: generateId(),
                timeSignature: { beats: 4, division: 4, divisionType: 'sixteenth' },
                tracks: focusedInstruments.map(instrument => ({
                  id: generateId(),
                  instrument: instrument as InstrumentKey,
                  notes: Array(16).fill('.')
                }))
              }]
            }
          ],
          created: now,
          modified: now
        };
        state.songs.push(newSong);
        state.activeSongId = newSong.id;
      }
    },

    // Remove a song
    removeSong: (state, action: PayloadAction<string>) => {
      const index = state.songs.findIndex(s => s.id === action.payload);
      if (index !== -1) {
        state.songs.splice(index, 1);
        if (state.activeSongId === action.payload && state.songs.length > 0) {
          state.activeSongId = state.songs[0].id;
        }
      }
    },

    // Update song metadata
    updateSongMetadata: (state, action: PayloadAction<{ id: string; title?: string; tempo?: number; description?: string; links?: string[] }>) => {
      console.log('updateSongMetadata', action.payload);
      const song = state.songs.find(s => s.id === action.payload.id);
      if (song) {
        if (action.payload.title !== undefined) song.title = action.payload.title;
        if (action.payload.tempo !== undefined) song.tempo = action.payload.tempo;
        if (action.payload.description !== undefined) song.description = action.payload.description;
        if (action.payload.links !== undefined) song.links = action.payload.links;
        song.modified = new Date().toISOString();
      }
    },

    // Add a section (at end or at specific index)
    addSection: (state, action: PayloadAction<{ songId: string; name: string; tempo?: number; index?: number; focusedInstruments?: string[] }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const focusedInstruments = action.payload.focusedInstruments && action.payload.focusedInstruments.length > 0
          ? action.payload.focusedInstruments
          : ['djembe'];  // Fallback to djembe if no focused instruments

        const newSection: Section = {
          id: generateId(),
          name: action.payload.name,
          tempo: action.payload.tempo,
          measures: [{
            id: generateId(),
            timeSignature: { beats: 4, division: 4, divisionType: 'sixteenth' },
            tracks: focusedInstruments.map(instrument => ({
              id: generateId(),
              instrument: instrument as InstrumentKey,
              notes: Array(16).fill('.')
            }))
          }]
        };

        if (action.payload.index !== undefined) {
          // Insert at specific index
          song.sections.splice(action.payload.index, 0, newSection);
        } else {
          // Add at end
          song.sections.push(newSection);
        }
        song.modified = new Date().toISOString();
      }
    },

    // Move a section to a new position
    moveSection: (state, action: PayloadAction<{ songId: string; sectionId: string; targetIndex: number }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const sourceIndex = song.sections.findIndex(s => s.id === action.payload.sectionId);

        if (sourceIndex !== -1) {
          console.log(`[Redux] Moving section from index ${sourceIndex} to ${action.payload.targetIndex}`);

          // Remove from source
          const [section] = song.sections.splice(sourceIndex, 1);

          // Calculate adjusted target index (same logic as measure moves)
          let adjustedIndex = action.payload.targetIndex;
          if (sourceIndex < action.payload.targetIndex) {
            adjustedIndex = action.payload.targetIndex - 1;
            console.log(`[Redux] Adjusted target from ${action.payload.targetIndex} to ${adjustedIndex}`);
          }

          // Insert at adjusted index
          song.sections.splice(adjustedIndex, 0, section);
          console.log(`[Redux] Section inserted at index ${adjustedIndex}`);

          song.modified = new Date().toISOString();
        }
      }
    },

    // Remove a section
    removeSection: (state, action: PayloadAction<{ songId: string; sectionId: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song && song.sections.length > 1) {
        const index = song.sections.findIndex(s => s.id === action.payload.sectionId);
        if (index !== -1) {
          song.sections.splice(index, 1);
          song.modified = new Date().toISOString();
        }
      }
    },

    // Update section metadata
    updateSection: (state, action: PayloadAction<{ songId: string; sectionId: string; name?: string; tempo?: number; notes?: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          if (action.payload.name !== undefined) section.name = action.payload.name;
          if (action.payload.tempo !== undefined) section.tempo = action.payload.tempo;
          if (action.payload.notes !== undefined) section.notes = action.payload.notes;
          song.modified = new Date().toISOString();
        }
      }
    },

    // Add a measure to a section
    addMeasure: (state, action: PayloadAction<{ songId: string; sectionId: string; timeSignature?: TimeSignature; focusedInstruments?: string[] }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const timeSig = action.payload.timeSignature || { beats: 4, division: 4, divisionType: 'sixteenth' as const };
          const subdivisions = getSubdivisionsPerBeat(timeSig.divisionType);
          const focusedInstruments = action.payload.focusedInstruments && action.payload.focusedInstruments.length > 0
            ? action.payload.focusedInstruments
            : ['djembe'];  // Fallback to djembe if no focused instruments

          const newMeasure: Measure = {
            id: generateId(),
            timeSignature: timeSig,
            tracks: focusedInstruments.map(instrument => ({
              id: generateId(),
              instrument: instrument as InstrumentKey,
              notes: Array(timeSig.beats * subdivisions).fill('.')
            }))
          };
          section.measures.push(newMeasure);
          song.modified = new Date().toISOString();
        }
      }
    },

    // Remove a measure from a section
    removeMeasure: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section && section.measures.length > 1) {
          const index = section.measures.findIndex(m => m.id === action.payload.measureId);
          if (index !== -1) {
            section.measures.splice(index, 1);
            song.modified = new Date().toISOString();
          }
        }
      }
    },

    // Duplicate a measure
    duplicateMeasure: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const index = section.measures.findIndex(m => m.id === action.payload.measureId);
          if (index !== -1) {
            const originalMeasure = section.measures[index];
            // Deep copy the measure with new IDs
            const duplicatedMeasure: Measure = {
              id: generateId(),
              timeSignature: { ...originalMeasure.timeSignature },
              tracks: originalMeasure.tracks.map(track => ({
                id: generateId(),
                instrument: track.instrument,
                label: track.label,
                notes: [...track.notes] // Copy notes array
              }))
            };
            // Insert the duplicate right after the original
            section.measures.splice(index + 1, 0, duplicatedMeasure);
            song.modified = new Date().toISOString();
          }
        }
      }
    },

    // Move a measure within the same section or to a different section
    moveMeasure: (state, action: PayloadAction<{
      songId: string;
      sourceSectionId: string;
      targetSectionId: string;
      measureId: string;
      targetIndex: number;
    }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const sourceSection = song.sections.find(s => s.id === action.payload.sourceSectionId);
        const targetSection = song.sections.find(s => s.id === action.payload.targetSectionId);

        if (sourceSection && targetSection) {
          const sourceIndex = sourceSection.measures.findIndex(m => m.id === action.payload.measureId);

          if (sourceIndex !== -1) {
            console.log(`[Redux] Moving from sourceIndex=${sourceIndex} to targetIndex=${action.payload.targetIndex}`);

            // Remove from source
            const [measure] = sourceSection.measures.splice(sourceIndex, 1);

            // Calculate adjusted target index
            let adjustedIndex = action.payload.targetIndex;

            // When moving within the same section forward (sourceIndex < targetIndex),
            // the removal shifts indices, so we need to adjust
            if (sourceSection === targetSection && sourceIndex < action.payload.targetIndex) {
              adjustedIndex = action.payload.targetIndex - 1;
              console.log(`[Redux] Adjusted target from ${action.payload.targetIndex} to ${adjustedIndex}`);
            }

            // Insert at adjusted index
            targetSection.measures.splice(adjustedIndex, 0, measure);
            console.log(`[Redux] Inserted at index ${adjustedIndex}`);

            song.modified = new Date().toISOString();
          }
        }
      }
    },

    // Add a track to a measure
    addTrack: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string; instrument: InstrumentKey; label?: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const measure = section.measures.find(m => m.id === action.payload.measureId);
          if (measure) {
            const subdivisions = getSubdivisionsPerBeat(measure.timeSignature.divisionType);
            const newTrack: InstrumentTrack = {
              id: generateId(),
              instrument: action.payload.instrument,
              label: action.payload.label,
              notes: Array(measure.timeSignature.beats * subdivisions).fill('.')
            };
            measure.tracks.push(newTrack);
            song.modified = new Date().toISOString();
          }
        }
      }
    },

    // Remove a track from a measure
    removeTrack: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string; trackId: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const measure = section.measures.find(m => m.id === action.payload.measureId);
          if (measure && measure.tracks.length > 1) {
            const index = measure.tracks.findIndex(t => t.id === action.payload.trackId);
            if (index !== -1) {
              measure.tracks.splice(index, 1);
              song.modified = new Date().toISOString();
            }
          }
        }
      }
    },

    // Update track notes
    updateTrackNotes: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string; trackId: string; notes: Note[] }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const measure = section.measures.find(m => m.id === action.payload.measureId);
          if (measure) {
            const track = measure.tracks.find(t => t.id === action.payload.trackId);
            if (track) {
              track.notes = action.payload.notes;
              song.modified = new Date().toISOString();
            }
          }
        }
      }
    },

    // Update measure time signature
    updateMeasureTimeSignature: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string; timeSignature: TimeSignature }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const measure = section.measures.find(m => m.id === action.payload.measureId);
          if (measure) {
            measure.timeSignature = action.payload.timeSignature;
            // Resize all tracks to match new time signature
            const subdivisions = getSubdivisionsPerBeat(action.payload.timeSignature.divisionType);
            const newLength = action.payload.timeSignature.beats * subdivisions;
            measure.tracks.forEach(track => {
              if (track.notes.length < newLength) {
                while (track.notes.length < newLength) {
                  track.notes.push('.');
                }
              } else if (track.notes.length > newLength) {
                track.notes = track.notes.slice(0, newLength);
              }
            });
            song.modified = new Date().toISOString();
          }
        }
      }
    },

    // Update measure notes
    updateMeasureNotes: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string; notes: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const measure = section.measures.find(m => m.id === action.payload.measureId);
          if (measure) {
            measure.notes = action.payload.notes;
            song.modified = new Date().toISOString();
          }
        }
      }
    },

    // Toggle track visibility
    toggleTrackVisibility: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string; trackId: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const measure = section.measures.find(m => m.id === action.payload.measureId);
          if (measure) {
            const track = measure.tracks.find(t => t.id === action.payload.trackId);
            if (track) {
              // Toggle visibility (undefined or true becomes false, false becomes true)
              track.visible = track.visible === false ? true : false;
              song.modified = new Date().toISOString();
            }
          }
        }
      }
    },

    // Apply focus filter to songs (hide unfocused instruments)
    applyFocusFilterToSongs: (state, action: PayloadAction<{ focusedInstruments: string[]; onlyDefaultSongs: boolean }>) => {
      const { focusedInstruments, onlyDefaultSongs } = action.payload;

      state.songs.forEach(song => {
        // If onlyDefaultSongs, skip user songs
        const isDefaultSong = song.id.startsWith('default-');
        if (onlyDefaultSongs && !isDefaultSong) return;

        // Apply filter to all tracks in all measures
        song.sections.forEach(section => {
          section.measures.forEach(measure => {
            measure.tracks.forEach(track => {
              // Only modify tracks where visibility hasn't been manually set
              // (visible === undefined means it hasn't been explicitly set)
              if (track.visible === undefined) {
                track.visible = focusedInstruments.includes(track.instrument);
              }
            });
          });
        });

        song.modified = new Date().toISOString();
      });
    },

    // Reorder songs (drag and drop)
    reorderSongs: (state, action: PayloadAction<Song[]>) => {
      // Update displayOrder based on new array order
      action.payload.forEach((song, index) => {
        const existing = state.songs.find(s => s.id === song.id);
        if (existing) {
          existing.displayOrder = index;
        }
      });
      // Sort songs by displayOrder
      state.songs.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    },

    // Reset all songs to defaults
    resetToDefaults: (state) => {
      const defaultSongs = loadDefaultSongs();
      state.songs = defaultSongs;
      state.activeSongId = defaultSongs[0]?.id || '';
    },
  },
});

export const {
  initializeSongs,
  setSongs,
  setActiveSong,
  addSong,
  removeSong,
  updateSongMetadata,
  addSection,
  moveSection,
  removeSection,
  updateSection,
  addMeasure,
  removeMeasure,
  duplicateMeasure,
  moveMeasure,
  addTrack,
  removeTrack,
  updateTrackNotes,
  updateMeasureTimeSignature,
  updateMeasureNotes,
  toggleTrackVisibility,
  applyFocusFilterToSongs,
  reorderSongs,
  resetToDefaults,
} = songsSlice.actions;

export default songsSlice.reducer;
