import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Song,
  Section,
  Measure,
  InstrumentTrack,
  Note,
  InstrumentType,
  TimeSignature,
  generateId,
  getSubdivisionsPerBeat
} from '../types';

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

    // Set active song by ID
    setActiveSong: (state, action: PayloadAction<string>) => {
      state.activeSongId = action.payload;
    },

    // Add a new song (or import a complete song)
    addSong: (state, action: PayloadAction<Partial<Song> & { title: string }>) => {
      const now = new Date().toISOString();

      // If this looks like a complete imported song, use it directly
      if (action.payload.id && action.payload.sections && action.payload.created) {
        const importedSong: Song = {
          ...action.payload as Song,
          modified: now
        };
        state.songs.push(importedSong);
        state.activeSongId = importedSong.id;
      } else {
        // Create a new song from scratch
        const newSong: Song = {
          id: generateId(),
          title: action.payload.title,
          description: action.payload.description,
          tempo: action.payload.tempo || 120,
          sections: [
            {
              id: generateId(),
              name: 'Intro',
              measures: [{
                id: generateId(),
                timeSignature: { beats: 4, division: 4, divisionType: 'sixteenth' },
                tracks: [{
                  id: generateId(),
                  instrument: 'djembe',
                  notes: Array(16).fill('.')
                }]
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
    updateSongMetadata: (state, action: PayloadAction<{ id: string; title?: string; tempo?: number; description?: string }>) => {
      const song = state.songs.find(s => s.id === action.payload.id);
      if (song) {
        if (action.payload.title !== undefined) song.title = action.payload.title;
        if (action.payload.tempo !== undefined) song.tempo = action.payload.tempo;
        if (action.payload.description !== undefined) song.description = action.payload.description;
        song.modified = new Date().toISOString();
      }
    },

    // Add a section (at end or at specific index)
    addSection: (state, action: PayloadAction<{ songId: string; name: string; tempo?: number; index?: number }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const newSection: Section = {
          id: generateId(),
          name: action.payload.name,
          tempo: action.payload.tempo,
          measures: [{
            id: generateId(),
            timeSignature: { beats: 4, division: 4, divisionType: 'sixteenth' },
            tracks: [{
              id: generateId(),
              instrument: 'djembe',
              notes: Array(16).fill('.')
            }]
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
    updateSection: (state, action: PayloadAction<{ songId: string; sectionId: string; name?: string; tempo?: number }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          if (action.payload.name !== undefined) section.name = action.payload.name;
          if (action.payload.tempo !== undefined) section.tempo = action.payload.tempo;
          song.modified = new Date().toISOString();
        }
      }
    },

    // Add a measure to a section
    addMeasure: (state, action: PayloadAction<{ songId: string; sectionId: string; timeSignature?: TimeSignature }>) => {
      const song = state.songs.find(s => s.id === action.payload.songId);
      if (song) {
        const section = song.sections.find(s => s.id === action.payload.sectionId);
        if (section) {
          const timeSig = action.payload.timeSignature || { beats: 4, division: 4, divisionType: 'sixteenth' as const };
          const subdivisions = getSubdivisionsPerBeat(timeSig.divisionType);
          const newMeasure: Measure = {
            id: generateId(),
            timeSignature: timeSig,
            tracks: [{
              id: generateId(),
              instrument: 'djembe',
              notes: Array(timeSig.beats * subdivisions).fill('.')
            }]
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
    addTrack: (state, action: PayloadAction<{ songId: string; sectionId: string; measureId: string; instrument: InstrumentType; label?: string }>) => {
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
  },
});

export const {
  initializeSongs,
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
} = songsSlice.actions;

export default songsSlice.reducer;
