# Drum Notation

A web-based drum notation app for West African drums (djembe and dun dun family).

## Features

### Instruments Supported
- **Djembe**: Bass (B), Tone (T), Slap (S), Accent (^), plus Open and Closed Flams
- **Dun Dun Family**: Sangban, Kenkeni, Dundunba with Open (O) and Muted (M) notes
- **Kenken (Cowbell)**: Open (O) and Muted (M) notes

### Current Features (v2.0)

#### Multiple Instruments Per Measure
- Stack multiple instrument tracks vertically in a single measure
- See how djembe and dun dun parts align rhythmically
- Add/remove tracks in any measure
- Color-coded notes for easy reading

#### Flexible Song Structure
- Create multiple songs
- Organize songs into named sections (not limited to intro/variants/outro)
- Add/remove sections dynamically
- Nested variants within sections

#### Time Signatures & Tempo
- Per-measure time signatures (2/4, 3/4, 4/4, 6/4)
- Support for 16th notes and triplets
- Per-song tempo (BPM)
- Optional per-section tempo overrides

#### Flam Support (Djembe)
- Custom flam builder: choose any combination of Bass, Tone, Slap, or Accent
- Open flams (shown with dash: `t-S`) and Closed flams (no dash: `tS`)
- Visual distinction with color coding
- Access via long-press on note cells

#### Editing Features
- Click notes to cycle through basic options
- Long-press (or click and hold) notes to open full note picker with flam options
- Edit song titles and tempo
- Edit section names and tempo
- Change time signatures per measure
- Delete songs, sections, measures, and tracks
- All changes auto-save to browser localStorage

#### Data Migration
- Automatic migration from v1.0 format
- Backwards compatible with existing songs

## How to Use

### Basic Navigation
1. **Switch between songs**: Click song tabs at the top
2. **Add new song**: Click "+ New Song" button
3. **Edit mode**: Click "✎ Edit" to enter edit mode

### In Edit Mode

#### Song Level
- Click song title to rename
- Click tempo (♩ = X BPM) to change
- Click "Delete" to remove song (with confirmation)

#### Section Level
- Click section name to rename
- Click tempo or "+ Set tempo" to add/change tempo override
- Click "Remove" to delete section
- Click "+ Add Section" to add new section

#### Measure Level
- Click time signature button (e.g., "4/4 · sixteenth") to change
  - Choose beats: 2, 3, 4, or 6
  - Choose division: 16ths or Triplets
- Click "⎘" to duplicate measure (creates copy with all tracks and notes)
- Click "×" to remove measure
- Click "+ Add Measure" card to add new measure
- **Drag and Drop**: In edit mode, drag measures to reorder within a section or move to different sections
  - Drag handle: entire measure card
  - Visual feedback: blue border highlights drop target
  - Drop before any measure to insert at that position

#### Track Level
- Click "+ Add Track" to add instrument
  - Choose: Djembe, Sangban, Kenkeni, Dundunba, or Kenken
- Click "×" on track header to remove track
- Click any note cell to cycle through notes
- Long-press (hold for 500ms) any note cell to open the note picker dialog

### Note Entry

#### Quick Entry (Click)
**Djembe**: Click cycles through · → B → T → S → ^ → ·
**Dun Dun & Kenken**: Click cycles through · → O → M → ·

#### Advanced Entry (Long-press)
**Djembe Long-press**: Opens note picker with:
- **Basic Notes**: · (rest), B (bass), T (tone), S (slap), ^ (accent)
- **Flam Builder**:
  - Select grace note: B, T, S, or ^
  - Select main note: B, T, S, or ^
  - Choose Closed (no dash, e.g., `tS`) or Open (with dash, e.g., `t-S`)
  - Live preview shows your flam before clicking "Done"
  - Default: `tS` (Tone-Slap, closed)

**Dun Dun & Kenken Long-press**: Opens note picker with · (rest), O (open), M (muted)

## Upcoming Features

- UI Enhancements
    - Change song tabs to a drop-down menu
    - Song selection is disabled until editing is complete; can't switch songs while editing
- Song duplication
- Ability to add a song description/text
- Import/Export Song(s)
- Mobile UI optimizations
- Tap tempo
- Breakup the SongEditor component into the smallest composable/reusable components.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Data Storage

Songs are stored in browser localStorage and automatically save on every change. Your data persists across sessions on the same browser/device.
