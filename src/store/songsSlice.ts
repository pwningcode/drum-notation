import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimeSignature, Section } from '../Song';

export interface SongData {
  title: string;
  timeSig: TimeSignature;
  intro: Section;
  variants: Section[];
  outro: Section;
}

export interface SongsState {
  songs: SongData[];
  version: string;
  activeSongTitle: string;
}

const initialState: SongsState = {
  songs: [],
  version: '1.0.0',
  activeSongTitle: '',
};

const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    initializeSongs: (state, action: PayloadAction<{ songs: SongData[]; version: string }>) => {
      state.songs = action.payload.songs;
      state.version = action.payload.version;
      if (action.payload.songs.length > 0 && !state.activeSongTitle) {
        state.activeSongTitle = action.payload.songs[0].title;
      }
    },
    setActiveSong: (state, action: PayloadAction<string>) => {
      state.activeSongTitle = action.payload;
    },
    updateSong: (state, action: PayloadAction<{ title: string; data: Partial<SongData> }>) => {
      const { title, data } = action.payload;
      const songIndex = state.songs.findIndex(song => song.title === title);
      if (songIndex !== -1) {
        state.songs[songIndex] = { ...state.songs[songIndex], ...data };
      }
    },
    addMeasureToIntro: (state, action: PayloadAction<{ title: string; beats: number }>) => {
      const { title, beats } = action.payload;
      const song = state.songs.find(song => song.title === title);
      if (song) {
        const emptyMeasure = Array(beats * 4).fill('.');
        song.intro.push(emptyMeasure);
      }
    },
    removeMeasureFromIntro: (state, action: PayloadAction<{ title: string; measureIndex: number }>) => {
      const { title, measureIndex } = action.payload;
      const song = state.songs.find(song => song.title === title);
      if (song && song.intro.length > 1) {
        song.intro.splice(measureIndex, 1);
      }
    },
    addMeasureToVariant: (state, action: PayloadAction<{ title: string; variantIndex: number; beats: number }>) => {
      const { title, variantIndex, beats } = action.payload;
      const song = state.songs.find(song => song.title === title);
      if (song && song.variants[variantIndex]) {
        const emptyMeasure = Array(beats * 4).fill('.');
        song.variants[variantIndex].push(emptyMeasure);
      }
    },
    removeMeasureFromVariant: (state, action: PayloadAction<{ title: string; variantIndex: number; measureIndex: number }>) => {
      const { title, variantIndex, measureIndex } = action.payload;
      const song = state.songs.find(song => song.title === title);
      if (song && song.variants[variantIndex] && song.variants[variantIndex].length > 1) {
        song.variants[variantIndex].splice(measureIndex, 1);
      }
    },
    addMeasureToOutro: (state, action: PayloadAction<{ title: string; beats: number }>) => {
      const { title, beats } = action.payload;
      const song = state.songs.find(song => song.title === title);
      if (song) {
        const emptyMeasure = Array(beats * 4).fill('.');
        song.outro.push(emptyMeasure);
      }
    },
    removeMeasureFromOutro: (state, action: PayloadAction<{ title: string; measureIndex: number }>) => {
      const { title, measureIndex } = action.payload;
      const song = state.songs.find(song => song.title === title);
      if (song && song.outro.length > 1) {
        song.outro.splice(measureIndex, 1);
      }
    },
    updateMeasure: (state, action: PayloadAction<{ title: string; section: 'intro' | 'outro' | 'variants'; sectionIndex?: number; measureIndex: number; measure: any[] }>) => {
      const { title, section, sectionIndex, measureIndex, measure } = action.payload;
      const song = state.songs.find(song => song.title === title);
      if (song) {
        if (section === 'intro') {
          song.intro[measureIndex] = measure;
        } else if (section === 'outro') {
          song.outro[measureIndex] = measure;
        } else if (section === 'variants' && sectionIndex !== undefined) {
          song.variants[sectionIndex][measureIndex] = measure;
        }
      }
    },
    updateTimeSignature: (state, action: PayloadAction<{ title: string; timeSig: TimeSignature }>) => {
      const { title, timeSig } = action.payload;
      const song = state.songs.find(song => song.title === title);
      if (song) {
        song.timeSig = timeSig;
      }
    },
  },
});

export const {
  initializeSongs,
  setActiveSong,
  updateSong,
  addMeasureToIntro,
  removeMeasureFromIntro,
  addMeasureToVariant,
  removeMeasureFromVariant,
  addMeasureToOutro,
  removeMeasureFromOutro,
  updateMeasure,
  updateTimeSignature,
} = songsSlice.actions;

export default songsSlice.reducer;
