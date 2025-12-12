import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { LinkEditor } from "./LinkEditor";
import {
  Song,
  Section,
  Measure,
  InstrumentTrack,
  Note,
  InstrumentConfig,
  DjembeNote,
  FlamType,
  Feel,
  getSubdivisionsPerBeat,
  isFlam,
  formatFlam,
  getMeasureGridSize,
  getTrackCycleLength,
  mapGridToCycle,
} from "../types";
import {
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
  updateSongMetadata,
  toggleTrackVisibility,
  toggleCycleEditing,
  updateTrackCycle,
  updateMeasureGrid,
} from "../store/songsSlice";

/** ---------- Helper Functions ---------- */

// Get cycle background class for alternating cycle visualization
function getCycleBgClass(cycleNumber: number, style: 'subtle' | 'moderate' | 'strong' | 'maximum'): string {
  switch (style) {
    case 'subtle':
    case 'moderate':
      return '';  // No background, just borders

    case 'strong':
      // Alternating backgrounds for visual cycle separation
      return cycleNumber % 2 === 0
        ? 'bg-blue-900/20'
        : 'bg-purple-900/20';

    case 'maximum':
      // Stronger backgrounds
      return cycleNumber % 2 === 0
        ? 'bg-blue-900/30'
        : 'bg-purple-900/30';

    default:
      return '';
  }
}

/** ---------- Types ---------- */

interface SongEditorProps {
  song: Song;
  isEditing: boolean;
}

/** ---------- Helper Functions ---------- */

// Get instrument config by key, with fallback for missing instruments
function getInstrumentConfig(key: string, configs: InstrumentConfig[]): InstrumentConfig {
  const config = configs.find(c => c.key === key);
  if (config) return config;

  // Fallback for missing/deleted instruments
  return {
    key,
    name: `Unknown (${key})`,
    displayOrder: 999,
    availableNotes: ['.'],
    cycleOrder: ['.'],
    noteLabels: { '.': 'Rest' },
    noteColors: { '.': 'text-zinc-500' },
    noteSymbols: { '.': '·' },
    flamNotes: [],
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  };
}

// Get the next note in the cycle for the given instrument
function getNextNote(current: Note, config: InstrumentConfig): Note {
  // Flams cycle back to rest
  if (isFlam(current)) {
    return '.';
  }

  // Find current note in cycle order
  const currentIndex = config.cycleOrder.indexOf(current as string);
  if (currentIndex === -1) {
    // Note not in cycle, default to first note
    return (config.cycleOrder[0] || '.') as Note;
  }

  // Get next note in cycle
  const nextIndex = (currentIndex + 1) % config.cycleOrder.length;
  return config.cycleOrder[nextIndex] as Note;
}

// Get symbol to display for a note
function symbolFor(note: Note, config: InstrumentConfig): string {
  if (isFlam(note)) {
    return formatFlam(note);
  }

  // Check for custom symbol override
  if (config.noteSymbols && typeof note === 'string' && config.noteSymbols[note]) {
    return config.noteSymbols[note];
  }

  return typeof note === 'string' ? note : '.';
}

// Get color class for a note
function getColorClass(note: Note, config: InstrumentConfig): string {
  if (isFlam(note)) {
    // Open flams use brighter purple, closed flams use regular purple
    return note.open ? 'text-purple-200' : 'text-purple-300';
  }

  // Get color from config
  if (typeof note === 'string') {
    return config.noteColors[note] || 'text-zinc-500';
  }

  return 'text-zinc-500';
}


// Get instrument display name
function getInstrumentName(config: InstrumentConfig): string {
  return config.name;
}

/** ---------- NotePickerDialog Component ---------- */

interface NotePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentNote: Note;
  instrumentConfig: InstrumentConfig;
  onSelectNote: (note: Note) => void;
}

const NotePickerDialog: React.FC<NotePickerDialogProps> = ({
  isOpen,
  onClose,
  currentNote,
  instrumentConfig,
  onSelectNote,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Flam builder state - default to first two flam-compatible notes
  const defaultFlamNotes = instrumentConfig.flamNotes.length >= 2
    ? [instrumentConfig.flamNotes[0], instrumentConfig.flamNotes[1]]
    : instrumentConfig.availableNotes.length >= 2
    ? [instrumentConfig.availableNotes[1], instrumentConfig.availableNotes[1]]
    : ['.', '.'];

  const [flamGrace, setFlamGrace] = useState<string>(defaultFlamNotes[0]);
  const [flamMain, setFlamMain] = useState<string>(defaultFlamNotes[1]);
  const [flamOpen, setFlamOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Initialize flam builder if current note is a flam
  useEffect(() => {
    if (isFlam(currentNote)) {
      setFlamGrace(currentNote.grace as string);
      setFlamMain(currentNote.main as string);
      setFlamOpen(currentNote.open || false);
    } else {
      setFlamGrace(defaultFlamNotes[0]);
      setFlamMain(defaultFlamNotes[1]);
      setFlamOpen(false);
    }
  }, [currentNote, defaultFlamNotes]);

  if (!isOpen) return null;

  const handleSelect = (note: Note) => {
    onSelectNote(note);
    onClose();
  };

  const handleCreateFlam = () => {
    const flam: FlamType = {
      type: 'flam',
      grace: flamGrace as DjembeNote,
      main: flamMain as DjembeNote,
      open: flamOpen,
    };
    handleSelect(flam);
  };

  // Helper to get note label from config
  const getNoteLabel = (note: string): string => {
    return instrumentConfig.noteLabels[note] || note;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        ref={dialogRef}
        className="bg-zinc-800 rounded-lg border border-zinc-600 shadow-xl p-4 min-w-[320px] max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200">Select Note</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-xl leading-none"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Basic Notes Grid */}
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Basic Notes</label>
            <div className="grid grid-cols-5 gap-2">
              {instrumentConfig.availableNotes.map((note: string) => (
                <button
                  key={note}
                  onClick={() => handleSelect(note as Note)}
                  className={`px-3 py-2 rounded text-sm font-semibold ${
                    currentNote === note
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  } ${getColorClass(note as Note, instrumentConfig)}`}
                  title={getNoteLabel(note)}
                >
                  {symbolFor(note as Note, instrumentConfig)}
                </button>
              ))}
            </div>
          </div>

          {/* Flam Builder - only show if instrument has flam-compatible notes */}
          {instrumentConfig.flamNotes.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-zinc-700">
              <label className="text-xs text-zinc-400 block">Flam Builder</label>

              {/* Grace Note Selector */}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Grace Note (leading)</label>
                <div className="grid grid-cols-4 gap-2">
                  {instrumentConfig.flamNotes.map((note: string) => (
                    <button
                      key={`grace-${note}`}
                      onClick={() => setFlamGrace(note)}
                      className={`px-3 py-2 rounded text-sm font-semibold ${
                        flamGrace === note
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-700 hover:bg-zinc-600'
                      } ${getColorClass(note as Note, instrumentConfig)}`}
                      title={getNoteLabel(note)}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Note Selector */}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Main Note</label>
                <div className="grid grid-cols-4 gap-2">
                  {instrumentConfig.flamNotes.map((note: string) => (
                    <button
                      key={`main-${note}`}
                      onClick={() => setFlamMain(note)}
                      className={`px-3 py-2 rounded text-sm font-semibold ${
                        flamMain === note
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-700 hover:bg-zinc-600'
                      } ${getColorClass(note as Note, instrumentConfig)}`}
                      title={getNoteLabel(note)}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open/Closed Toggle */}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Flam Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFlamOpen(false)}
                    className={`px-3 py-2 rounded text-sm font-semibold ${
                      !flamOpen
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-700 hover:bg-zinc-600 text-purple-300'
                    }`}
                  >
                    Closed (no dash)
                  </button>
                  <button
                    onClick={() => setFlamOpen(true)}
                    className={`px-3 py-2 rounded text-sm font-semibold ${
                      flamOpen
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-700 hover:bg-zinc-600 text-purple-300'
                    }`}
                  >
                    Open (with dash)
                  </button>
                </div>
              </div>

              {/* Preview and Create */}
              <div className="pt-2 border-t border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-zinc-500">Preview:</label>
                  <div className="text-lg font-bold text-purple-300">
                    {formatFlam({ type: 'flam', grace: flamGrace as DjembeNote, main: flamMain as DjembeNote, open: flamOpen })}
                  </div>
                </div>
                <button
                  onClick={handleCreateFlam}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                >
                  Insert Flam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** ---------- InstrumentTrack Component ---------- */

interface InstrumentTrackViewProps {
  track: InstrumentTrack;
  measure: Measure;
  sectionId: string;
  songId: string;
  editable: boolean;
  canRemove: boolean;
}

const InstrumentTrackView: React.FC<InstrumentTrackViewProps> = ({
  track,
  measure,
  sectionId,
  songId,
  editable,
  canRemove,
}) => {
  const dispatch = useAppDispatch();
  const instruments = useAppSelector(state => state.instruments.instruments);
  const instrumentConfig = getInstrumentConfig(track.instrument, instruments);
  const westernNotation = useAppSelector(state => state.preferences.westernNotation);

  // Multi-cycle support: use measure grid size and track cycle length
  const gridSize = getMeasureGridSize(measure);
  const cycleLength = getTrackCycleLength(track);
  const pulsesPerBeat = measure.visualGrid?.pulsesPerBeat ?? getSubdivisionsPerBeat(measure.timeSignature.divisionType);
  const startOffset = track.startOffset ?? 0;

  const [notePickerState, setNotePickerState] = useState<{
    isOpen: boolean;
    noteIndex: number;
    position: { x: number; y: number };
  }>({ isOpen: false, noteIndex: -1, position: { x: 0, y: 0 } });

  const longPressTimerRef = useRef<any | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleCellClick = (gridIndex: number) => {
    if (!editable) return;

    const isCycleMode = track.cycleEditingEnabled ?? true;

    if (isCycleMode) {
      // Cycle mode: Edit applies to all cycle repetitions
      const cyclePos = mapGridToCycle(gridIndex, track);
      if (cyclePos === null) return; // Not editable (outside track's cycle)

      const newNotes = [...track.notes];
      newNotes[cyclePos] = getNextNote(newNotes[cyclePos], instrumentConfig);

      dispatch(updateTrackNotes({
        songId,
        sectionId,
        measureId: measure.id,
        trackId: track.id,
        notes: newNotes,
      }));
    } else {
      // Individual mode: Edit only this specific grid position
      if (gridIndex < 0 || gridIndex >= track.notes.length) return;

      const newNotes = [...track.notes];
      newNotes[gridIndex] = getNextNote(newNotes[gridIndex], instrumentConfig);

      dispatch(updateTrackNotes({
        songId,
        sectionId,
        measureId: measure.id,
        trackId: track.id,
        notes: newNotes,
      }));
    }
  };

  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    if (!editable) return;

    pressStartRef.current = { x: event.clientX, y: event.clientY };

    longPressTimerRef.current = setTimeout(() => {
      // Long press detected - open note picker
      setNotePickerState({
        isOpen: true,
        noteIndex: index,
        position: { x: event.clientX, y: event.clientY },
      });
      longPressTimerRef.current = null;
    }, 500); // 500ms for long press
  };

  const handleMouseUp = (index: number) => {
    if (!editable) return;

    if (longPressTimerRef.current) {
      // Short press - cycle to next note
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      handleCellClick(index);
    }
    pressStartRef.current = null;
  };

  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pressStartRef.current = null;
  };

  const handleTouchStart = (index: number, event: React.TouchEvent) => {
    if (!editable) return;

    const touch = event.touches[0];
    pressStartRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      // Long press detected - open note picker
      setNotePickerState({
        isOpen: true,
        noteIndex: index,
        position: { x: touch.clientX, y: touch.clientY },
      });
      longPressTimerRef.current = null;
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = (index: number) => {
    if (!editable) return;

    if (longPressTimerRef.current) {
      // Short press - cycle to next note
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      handleCellClick(index);
    }
    pressStartRef.current = null;
  };

  const handleNoteSelect = (note: Note) => {
    const isCycleMode = track.cycleEditingEnabled ?? true;

    if (isCycleMode) {
      // Cycle mode: Edit applies to all cycle repetitions
      const cyclePos = mapGridToCycle(notePickerState.noteIndex, track);
      if (cyclePos === null) return; // Invalid position

      const newNotes = [...track.notes];
      newNotes[cyclePos] = note;

      dispatch(updateTrackNotes({
        songId,
        sectionId,
        measureId: measure.id,
        trackId: track.id,
        notes: newNotes,
      }));
    } else {
      // Individual mode: Edit only this specific grid position
      const gridIndex = notePickerState.noteIndex;
      if (gridIndex < 0 || gridIndex >= track.notes.length) return;

      const newNotes = [...track.notes];
      newNotes[gridIndex] = note;

      dispatch(updateTrackNotes({
        songId,
        sectionId,
        measureId: measure.id,
        trackId: track.id,
        notes: newNotes,
      }));
    }
  };

  const handleRemoveTrack = () => {
    dispatch(removeTrack({
      songId,
      sectionId,
      measureId: measure.id,
      trackId: track.id,
    }));
  };

  const handleToggleVisibility = () => {
    dispatch(toggleTrackVisibility({
      songId,
      sectionId,
      measureId: measure.id,
      trackId: track.id,
    }));
  };

  const [showCycleEditor, setShowCycleEditor] = useState(false);

  const handleToggleCycleEditing = () => {
    dispatch(toggleCycleEditing({
      songId,
      sectionId,
      measureId: measure.id,
      trackId: track.id,
    }));
  };

  const isCycleEditingEnabled = track.cycleEditingEnabled ?? true; // default is true
  const isHidden = track.visible === false;

  return (
    <>
      <div className={`border-t border-zinc-600 first:border-t-0 ${isHidden ? 'opacity-40' : ''}`}>
        <div className="flex items-center justify-between px-1.5 sm:px-2 py-0.5 sm:py-1 bg-zinc-800/30">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            {editable && (
              <button
                onClick={handleToggleVisibility}
                className="text-zinc-400 hover:text-zinc-200 text-xs sm:text-sm flex-shrink-0"
                title={isHidden ? "Show track" : "Hide track"}
              >
                {isHidden ? '👁️' : '👁️‍🗨️'}
              </button>
            )}
            <span className={`text-[10px] sm:text-xs truncate ${instrumentConfig.color || 'text-zinc-400'}`}>
              {getInstrumentName(instrumentConfig)}
              {track.label && ` - ${track.label}`}
            </span>
            {editable && !showCycleEditor && (
              <button
                onClick={() => setShowCycleEditor(true)}
                className="text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer"
                title="Click to edit cycle length"
              >
                ({cycleLength}p)
              </button>
            )}
            {editable && showCycleEditor && (
              <div className="flex items-center gap-1 flex-wrap">
                {/* Common pulse count presets */}
                {[2, 3, 4, 6, 8, 12, 16, 24, 32, 48].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      dispatch(updateTrackCycle({
                        songId,
                        sectionId,
                        measureId: measure.id,
                        trackId: track.id,
                        cycleLength: preset,
                      }));
                      setShowCycleEditor(false);
                    }}
                    className={`px-1.5 py-0.5 text-[10px] rounded border ${
                      cycleLength === preset
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const custom = prompt('Enter custom pulse count:', cycleLength.toString());
                    if (custom && !isNaN(parseInt(custom))) {
                      const newCycleLength = parseInt(custom);
                      if (newCycleLength >= 1 && newCycleLength <= 128) {
                        dispatch(updateTrackCycle({
                          songId,
                          sectionId,
                          measureId: measure.id,
                          trackId: track.id,
                          cycleLength: newCycleLength,
                        }));
                      }
                    }
                    setShowCycleEditor(false);
                  }}
                  className="px-1.5 py-0.5 text-[10px] rounded border bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600"
                >
                  Custom
                </button>
                <button
                  onClick={() => setShowCycleEditor(false)}
                  className="text-[10px] text-red-400 hover:text-red-300 ml-1"
                  title="Cancel"
                >
                  ✗
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {editable && (
              <button
                onClick={handleToggleCycleEditing}
                className={`px-1.5 py-0.5 text-[10px] rounded border flex-shrink-0 ${
                  isCycleEditingEnabled
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-zinc-700 border-zinc-600 text-zinc-300'
                }`}
                title={isCycleEditingEnabled ? "Cycle Mode: Edits apply to all cycles" : "Individual Mode: Edit each note separately"}
              >
                {isCycleEditingEnabled ? '🔁' : '1️⃣'}
              </button>
            )}
            {editable && canRemove && (
              <button
                onClick={handleRemoveTrack}
                className="text-red-400 hover:text-red-300 text-xs sm:text-sm flex-shrink-0"
                title="Remove track"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Single pulse loop grid rendering (cycles-first) */}
        <div className="flex flex-wrap">
          {Array.from({ length: gridSize }).map((_, pulseIdx) => {
            // Determine note based on cycle editing mode
            const isCycleMode = track.cycleEditingEnabled ?? true;
            let note: Note | null;
            let isEditable: boolean;
            let isCycleBoundary = false;

            if (isCycleMode) {
              // Cycle mode: Map grid position to track cycle position
              const cyclePos = mapGridToCycle(pulseIdx, track);
              note = cyclePos !== null && cyclePos < track.notes.length ? track.notes[cyclePos] : null;
              isEditable = cyclePos !== null;
              // Check if this is a cycle boundary (for visual indicator)
              isCycleBoundary = cyclePos === 0 && pulseIdx > startOffset;
            } else {
              // Individual mode: Direct index into notes array
              note = pulseIdx < track.notes.length ? track.notes[pulseIdx] : null;
              isEditable = pulseIdx < track.notes.length;
              // No cycle boundaries in individual mode
              isCycleBoundary = false;
            }

            // Calculate cycle number for background coloring
            const cycleNumber = Math.floor((pulseIdx - startOffset) / cycleLength);

            // Beat boundary border for Western notation
            const isBeatBoundary = westernNotation.enabled &&
                                   westernNotation.showBeatGroupings &&
                                   pulseIdx % pulsesPerBeat === 0 &&
                                   pulseIdx > 0;

            // Responsive wrapping: insert line break every 16 pulses on mobile
            const shouldWrap = pulseIdx > 0 && pulseIdx % 16 === 0;

            return (
              <React.Fragment key={pulseIdx}>
                {shouldWrap && <div className="w-full h-0 sm:hidden" />}
                <div
                  onMouseDown={(e) => isEditable && handleMouseDown(pulseIdx, e)}
                  onMouseUp={() => isEditable && handleMouseUp(pulseIdx)}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={(e) => isEditable && handleTouchStart(pulseIdx, e)}
                  onTouchEnd={() => isEditable && handleTouchEnd(pulseIdx)}
                  className={[
                    'h-8 w-6 sm:w-10 flex items-center justify-center text-xs sm:text-sm font-semibold',
                    'border-r border-b border-zinc-600',
                    isEditable && editable ? 'cursor-pointer hover:bg-zinc-700/60' : 'bg-zinc-800/50',
                    isCycleBoundary && measure.visualGrid?.showCycleGuides ? 'border-l-4 border-l-blue-400' : '',
                    getCycleBgClass(cycleNumber, westernNotation.cycleGuideStyle),
                    isBeatBoundary ? 'border-l-2 border-l-zinc-500' : '',
                    note ? getColorClass(note, instrumentConfig) : 'text-zinc-500',
                  ].join(' ')}
                  title={
                    !isEditable
                      ? 'outside track cycle'
                      : note && isFlam(note)
                      ? `${note.open ? 'Open' : 'Closed'} Flam: ${note.grace} to ${note.main}`
                      : note === '.' || note === null
                      ? 'rest'
                      : note ? String(note) : 'rest'
                  }
                >
                  {note ? symbolFor(note, instrumentConfig) : '·'}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Note Picker Dialog */}
      {notePickerState.isOpen && notePickerState.noteIndex >= 0 && (() => {
        // Map grid index to cycle position to get the correct note
        const cyclePos = mapGridToCycle(notePickerState.noteIndex, track);
        const currentNote = cyclePos !== null && cyclePos < track.notes.length ? track.notes[cyclePos] : '.';
        return (
          <NotePickerDialog
            isOpen={notePickerState.isOpen}
            onClose={() => setNotePickerState({ ...notePickerState, isOpen: false })}
            currentNote={currentNote}
            instrumentConfig={instrumentConfig}
            onSelectNote={handleNoteSelect}
          />
        );
      })()}
    </>
  );
};

/** ---------- Measure Component ---------- */

interface DropZoneProps {
  sectionId: string;
  targetIndex: number;
  editable: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ sectionId, targetIndex, editable }) => {
  const dispatch = useAppDispatch();
  const [isActive, setIsActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!editable) return;
    e.stopPropagation();
    setIsActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsActive(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      console.log(`Dropping at index ${targetIndex}`);

      dispatch(moveMeasure({
        songId: data.songId,
        sourceSectionId: data.sourceSectionId,
        targetSectionId: sectionId,
        measureId: data.measureId,
        targetIndex,
      }));
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  if (!editable) return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-all w-full flex items-center justify-center ${
        isActive
          ? 'h-16 bg-blue-500/30 border-2 border-blue-500 border-dashed rounded'
          : 'h-8 bg-zinc-800/20 hover:bg-zinc-700/30 border-t-2 border-dashed border-zinc-600/50'
      }`}
    >
      {isActive && (
        <span className="text-blue-400 text-xs font-semibold">Drop here</span>
      )}
    </div>
  );
};

interface MeasureViewProps {
  measure: Measure;
  sectionId: string;
  songId: string;
  measureIndex: number;
  editable: boolean;
  canRemove: boolean;
}

const MeasureView: React.FC<MeasureViewProps> = ({
  measure,
  sectionId,
  songId,
  measureIndex,
  editable,
  canRemove,
}) => {
  const dispatch = useAppDispatch();
  const allInstruments = useAppSelector(state => state.instruments.instruments);
  const instruments = [...allInstruments].sort((a, b) => a.displayOrder - b.displayOrder);
  const westernNotation = useAppSelector(state => state.preferences.westernNotation);
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showTimeSignature, setShowTimeSignature] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState(measure.notes || '');

  // Multi-cycle support: use flexible grid size
  const gridSize = getMeasureGridSize(measure);
  const pulsesPerBeat = measure.visualGrid?.pulsesPerBeat ?? getSubdivisionsPerBeat(measure.timeSignature.divisionType);

  // Determine counting style from time signature's division type (user-controlled feel)
  const subLabels = measure.timeSignature.divisionType === 'triplet'
    ? ['1', 'la', 'le']
    : ['1', 'e', '&', 'a'];

  const handleRemoveMeasure = () => {
    dispatch(removeMeasure({
      songId,
      sectionId,
      measureId: measure.id,
    }));
  };

  const handleDuplicateMeasure = () => {
    dispatch(duplicateMeasure({
      songId,
      sectionId,
      measureId: measure.id,
    }));
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!editable) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      measureId: measure.id,
      sourceSectionId: sectionId,
      songId,
    }));
  };

  const handleAddTrack = (instrumentKey: string) => {
    dispatch(addTrack({
      songId,
      sectionId,
      measureId: measure.id,
      instrument: instrumentKey,
    }));
    setShowAddTrack(false);
  };

  const handleDivisionTypeChange = (divisionType: 'sixteenth' | 'triplet') => {
    dispatch(updateMeasureTimeSignature({
      songId,
      sectionId,
      measureId: measure.id,
      timeSignature: {
        beats: measure.timeSignature.beats, // preserve for backward compatibility
        division: 4,
        divisionType,
        feel: measure.timeSignature.feel, // preserve current feel
      },
    }));
  };

  const handleFeelChange = (feel: Feel | undefined) => {
    dispatch(updateMeasureTimeSignature({
      songId,
      sectionId,
      measureId: measure.id,
      timeSignature: {
        ...measure.timeSignature,
        feel,
      },
    }));
  };

  const handleToggleCycleGuides = () => {
    const currentGuides = measure.visualGrid?.showCycleGuides ?? false;
    dispatch(updateMeasureGrid({
      songId,
      sectionId,
      measureId: measure.id,
      visualGrid: {
        pulses: gridSize,
        pulsesPerBeat,
        showCycleGuides: !currentGuides,
      },
    }));
  };

  const handleSaveNotes = () => {
    dispatch(updateMeasureNotes({
      songId,
      sectionId,
      measureId: measure.id,
      notes: tempNotes.trim() || '',
    }));
    setIsEditingNotes(false);
  };

  return (
    <div
      draggable={editable}
      onDragStart={handleDragStart}
      className={`bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden min-w-fit ${
        editable ? 'cursor-move' : ''
      }`}
    >
      {/* Measure Header */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-zinc-800/50 flex items-center justify-between border-b border-zinc-700 whitespace-nowrap">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="text-[10px] sm:text-xs font-semibold text-zinc-300">
            M{measureIndex + 1}
          </span>
          {editable ? (
            <button
              onClick={() => setShowTimeSignature(!showTimeSignature)}
              className="text-[10px] sm:text-xs text-zinc-400 hover:text-zinc-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-zinc-600 hover:border-zinc-500"
            >
              {measure.timeSignature.divisionType === 'sixteenth' ? '16ths' : measure.timeSignature.divisionType === 'triplet' ? 'Triplets' : measure.timeSignature.divisionType}
            </button>
          ) : (
            <span className="text-[10px] sm:text-xs text-zinc-500">
              {measure.timeSignature.divisionType === 'sixteenth' ? '16ths' : measure.timeSignature.divisionType === 'triplet' ? 'Triplets' : measure.timeSignature.divisionType}
            </span>
          )}
          {measure.timeSignature.feel && measure.timeSignature.feel !== 'straight' && (
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/50 font-medium">
              {measure.timeSignature.feel}
            </span>
          )}
        </div>
        {editable && (
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleDuplicateMeasure}
              className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-blue-600/30 hover:border-blue-500/50"
              title="Duplicate measure"
            >
              ⎘
            </button>
            {canRemove && (
              <button
                onClick={handleRemoveMeasure}
                className="text-red-400 hover:text-red-300 text-base sm:text-lg font-bold"
                title="Remove measure"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* Time Signature Editor (Cycles-First: Only Division Type & Feel) */}
      {editable && showTimeSignature && (
        <div className="px-3 py-2 bg-zinc-800/30 border-b border-zinc-700 space-y-2">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-zinc-400">Feel:</span>
            <button
              onClick={() => handleDivisionTypeChange('sixteenth')}
              className={`px-2 py-1 text-xs rounded ${
                measure.timeSignature.divisionType === 'sixteenth'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
              }`}
            >
              16ths (1 e & a)
            </button>
            <button
              onClick={() => handleDivisionTypeChange('triplet')}
              className={`px-2 py-1 text-xs rounded ${
                measure.timeSignature.divisionType === 'triplet'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
              }`}
            >
              Triplets (1 la le)
            </button>
            <span className="text-xs text-zinc-400 ml-2">Feel:</span>
            {['straight', 'swing', 'half-time', 'double-time'].map((f) => (
              <button
                key={f}
                onClick={() => handleFeelChange(f === 'straight' ? undefined : f as Feel)}
                className={`px-2 py-1 text-xs rounded ${
                  (measure.timeSignature.feel || 'straight') === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
            <span className="text-xs text-zinc-400 ml-2">Cycle Guides:</span>
            <button
              onClick={handleToggleCycleGuides}
              className={`px-2 py-1 text-xs rounded ${
                measure.visualGrid?.showCycleGuides
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
              }`}
              title="Show cycle boundary markers"
            >
              {measure.visualGrid?.showCycleGuides ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {/* Subdivision Labels - Cycles-First (spans entire LCM grid) */}
      {westernNotation.enabled && westernNotation.showSubdivisionLabels && (
        <div className="flex flex-wrap border-b border-zinc-700 bg-zinc-900/50">
          {Array.from({ length: gridSize }).map((_, pulseIdx) => {
            // Calculate which subdivision label to show (repeating pattern across entire grid)
            const labelIdx = pulseIdx % subLabels.length;
            const lbl = subLabels[labelIdx];

            // Calculate which beat number this pulse belongs to (for display)
            const beatNumber = Math.floor(pulseIdx / pulsesPerBeat) + 1;

            // Beat boundary border (visual separator when Western notation enabled)
            const isBeatBoundary = westernNotation.showBeatGroupings && pulseIdx % pulsesPerBeat === 0 && pulseIdx > 0;

            // Responsive wrapping: insert line break every 16 pulses on mobile
            const shouldWrap = pulseIdx > 0 && pulseIdx % 16 === 0;

            return (
              <React.Fragment key={pulseIdx}>
                {shouldWrap && <div className="w-full h-0 sm:hidden" />}
                <div
                  className={[
                    'h-5 sm:h-6 w-6 sm:w-10 flex items-center justify-center text-[10px] sm:text-xs',
                    'border-r border-zinc-600',
                    lbl === '1' ? 'font-bold text-zinc-300' : 'text-zinc-500',
                    isBeatBoundary ? 'border-l-2 border-l-zinc-500' : '',
                  ].join(' ')}
                >
                  {lbl === '1' ? beatNumber : lbl}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Pulse Numbers - Cycles-First (when Western notation is OFF) */}
      {!westernNotation.enabled && (
        <div className="flex flex-wrap border-b border-zinc-700 bg-zinc-900/50">
          {Array.from({ length: gridSize }).map((_, pulseIdx) => {
            // Show pulse number every 4 pulses (on the beat)
            const showNumber = pulseIdx % 4 === 0;

            // Responsive wrapping: insert line break every 16 pulses on mobile
            const shouldWrap = pulseIdx > 0 && pulseIdx % 16 === 0;

            return (
              <React.Fragment key={pulseIdx}>
                {shouldWrap && <div className="w-full h-0 sm:hidden" />}
                <div
                  className={[
                    'h-5 sm:h-6 w-6 sm:w-10 flex items-center justify-center text-[10px] sm:text-xs',
                    'border-r border-zinc-600',
                    showNumber ? 'font-bold text-zinc-300' : 'text-zinc-600',
                  ].join(' ')}
                >
                  {showNumber ? pulseIdx : '·'}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Instrument Tracks */}
      {measure.tracks
        .filter(track => {
          // In edit mode: show all tracks (including hidden)
          // In view mode: only show visible tracks
          if (editable) return true;
          return track.visible !== false;
        })
        .map((track) => (
          <InstrumentTrackView
            key={track.id}
            track={track}
            measure={measure}
            sectionId={sectionId}
            songId={songId}
            editable={editable}
            canRemove={measure.tracks.length > 1}
          />
        ))}

      {/* Add Track Button */}
      {editable && (
        <div className="p-2 border-t border-zinc-700">
          {!showAddTrack ? (
            <button
              onClick={() => setShowAddTrack(true)}
              className="w-full py-1 text-xs text-zinc-400 hover:text-zinc-300 border border-dashed border-zinc-600 rounded hover:border-zinc-500"
            >
              + Add Track
            </button>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {instruments.map(config => (
                <button
                  key={config.key}
                  onClick={() => handleAddTrack(config.key)}
                  className={`px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded ${config.color || 'text-zinc-100'}`}
                >
                  {config.name}
                </button>
              ))}
              <button
                onClick={() => setShowAddTrack(false)}
                className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Measure Notes */}
      {(editable || measure.notes) && (
        <div className="px-2 py-2 border-t border-zinc-700">
          {editable && isEditingNotes ? (
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              onBlur={handleSaveNotes}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setTempNotes(measure.notes || '');
                  setIsEditingNotes(false);
                }
                // Allow Ctrl/Cmd+Enter to save
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleSaveNotes();
                }
              }}
              placeholder="Add notes for this measure..."
              autoFocus
              className="w-full text-xs bg-zinc-800 text-zinc-300 px-2 py-1.5 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none resize-y min-h-[50px]"
            />
          ) : measure.notes ? (
            <div
              className={`text-xs text-zinc-400 italic px-2 py-1.5 bg-zinc-800/30 rounded border border-zinc-700/50 ${
                editable ? 'cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-600' : ''
              }`}
              onClick={() => editable && setIsEditingNotes(true)}
            >
              {measure.notes}
            </div>
          ) : editable ? (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="w-full py-1 text-xs text-zinc-500 hover:text-zinc-400 border border-dashed border-zinc-600 rounded hover:border-zinc-500"
            >
              + Add measure notes
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

/** ---------- Section Component ---------- */

interface SectionViewProps {
  section: Section;
  songId: string;
  editable: boolean;
  canRemove: boolean;
}

const SectionView: React.FC<SectionViewProps> = ({
  section,
  songId,
  editable,
  canRemove,
}) => {
  const dispatch = useAppDispatch();
  const focusedInstruments = useAppSelector(state => state.preferences.instrumentFocus);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingTempo, setIsEditingTempo] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempName, setTempName] = useState(section.name);
  const [tempTempo, setTempTempo] = useState(section.tempo?.toString() || '');
  const [tempNotes, setTempNotes] = useState(section.notes || '');

  const handleRemoveSection = () => {
    dispatch(removeSection({
      songId,
      sectionId: section.id,
    }));
  };

  const handleAddMeasure = () => {
    dispatch(addMeasure({
      songId,
      sectionId: section.id,
      focusedInstruments,
    }));
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      dispatch(updateSection({
        songId,
        sectionId: section.id,
        name: tempName.trim(),
      }));
    }
    setIsEditingName(false);
  };

  const handleSaveTempo = () => {
    const tempo = tempTempo ? parseInt(tempTempo) : undefined;
    if (!tempTempo || (tempo && tempo > 0 && tempo <= 300)) {
      dispatch(updateSection({
        songId,
        sectionId: section.id,
        tempo,
      }));
      setIsEditingTempo(false);
    }
  };

  const handleRemoveTempo = () => {
    dispatch(updateSection({
      songId,
      sectionId: section.id,
      tempo: undefined,
    }));
    setTempTempo('');
    setIsEditingTempo(false);
  };

  const handleSaveNotes = () => {
    dispatch(updateSection({
      songId,
      sectionId: section.id,
      notes: tempNotes.trim() || undefined,
    }));
    setIsEditingNotes(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {editable && isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setTempName(section.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="text-sm font-semibold bg-zinc-800 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <h3
              className={`text-xs sm:text-sm font-semibold text-zinc-300 ${
                editable ? 'cursor-pointer hover:text-zinc-100' : ''
              }`}
              onClick={() => editable && setIsEditingName(true)}
            >
              {section.name}
            </h3>
          )}

          {editable && isEditingTempo ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">♩ =</span>
              <input
                type="number"
                value={tempTempo}
                onChange={(e) => setTempTempo(e.target.value)}
                onBlur={handleSaveTempo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTempo();
                  if (e.key === 'Escape') {
                    setTempTempo(section.tempo?.toString() || '');
                    setIsEditingTempo(false);
                  }
                }}
                placeholder="BPM"
                min="1"
                max="300"
                autoFocus
                className="w-16 text-xs bg-zinc-800 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleRemoveTempo}
                className="text-xs text-red-400 hover:text-red-300"
                title="Remove tempo override"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              {section.tempo ? (
                <span
                  className={`text-xs text-zinc-500 ${
                    editable ? 'cursor-pointer hover:text-zinc-400' : ''
                  }`}
                  onClick={() => editable && setIsEditingTempo(true)}
                >
                  ♩ = {section.tempo} BPM
                </span>
              ) : editable ? (
                <button
                  onClick={() => setIsEditingTempo(true)}
                  className="text-xs text-zinc-500 hover:text-zinc-400 px-2 py-1 border border-dashed border-zinc-600 rounded"
                >
                  + Set tempo
                </button>
              ) : null}
            </>
          )}
        </div>
        {editable && canRemove && (
          <button
            onClick={handleRemoveSection}
            className="text-red-400 hover:text-red-300 text-sm"
            title="Remove section"
          >
            Remove
          </button>
        )}
      </div>

      {/* Section Notes */}
      {(editable || section.notes) && (
        <div className="ml-0 sm:ml-6">
          {editable && isEditingNotes ? (
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              onBlur={handleSaveNotes}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setTempNotes(section.notes || '');
                  setIsEditingNotes(false);
                }
                // Allow Ctrl/Cmd+Enter to save
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  handleSaveNotes();
                }
              }}
              placeholder="Add notes for this section..."
              autoFocus
              className="w-full text-xs bg-zinc-800 text-zinc-300 px-3 py-2 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none resize-y min-h-[60px]"
            />
          ) : section.notes ? (
            <div
              className={`text-xs text-zinc-400 italic px-3 py-2 bg-zinc-800/30 rounded border border-zinc-700/50 ${
                editable ? 'cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-600' : ''
              }`}
              onClick={() => editable && setIsEditingNotes(true)}
            >
              {section.notes}
            </div>
          ) : editable ? (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-zinc-500 hover:text-zinc-400 px-2 py-1 border border-dashed border-zinc-600 rounded"
            >
              + Add section notes
            </button>
          ) : null}
        </div>
      )}

      {/* Measures Grid */}
      <div className={editable ? 'space-y-2' : 'space-y-3 sm:space-y-0'}>
        <div className={editable ? '' : 'flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4'}>
          {section.measures.map((measure, idx) => (
            <React.Fragment key={measure.id}>
              {/* Drop zone before each measure (only in edit mode) */}
              {editable && (
                <DropZone
                  sectionId={section.id}
                  targetIndex={idx}
                  editable={editable}
                />
              )}
              <MeasureView
                measure={measure}
                sectionId={section.id}
                songId={songId}
                measureIndex={idx}
                editable={editable}
                canRemove={section.measures.length > 1}
              />
            </React.Fragment>
          ))}

          {/* Drop zone after all measures (only in edit mode) */}
          {editable && (
            <DropZone
              sectionId={section.id}
              targetIndex={section.measures.length}
              editable={editable}
            />
          )}

          {/* Add Measure Button */}
          {editable && (
            <div className="mt-4 min-w-fit">
              <button
                onClick={handleAddMeasure}
                className="text-xs text-zinc-500 hover:text-zinc-400 px-2 py-1 border border-dashed border-zinc-600 rounded"
                title="Add measure"
              >
                + Add Measure
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Variants (if any) */}
      {section.variants && section.variants.length > 0 && (
        <div className="ml-4 sm:ml-8 space-y-3 sm:space-y-4 border-l-2 border-zinc-700 pl-2 sm:pl-4">
          {section.variants.map((variant) => (
            <SectionView
              key={variant.id}
              section={variant}
              songId={songId}
              editable={editable}
              canRemove={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** ---------- Section Drop Zone Component ---------- */

interface SectionDropZoneProps {
  songId: string;
  targetIndex: number;
  onAddSection: () => void;
}

const SectionDropZone: React.FC<SectionDropZoneProps> = ({ songId, targetIndex, onAddSection }) => {
  const dispatch = useAppDispatch();
  const [isActive, setIsActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsActive(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.sectionId && data.songId === songId) {
        console.log(`Dropping section at index ${targetIndex}`);

        dispatch(moveSection({
          songId: data.songId,
          sectionId: data.sectionId,
          targetIndex,
        }));
      }
    } catch (error) {
      console.error('Error handling section drop:', error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`transition-all w-full flex items-center justify-center ${
        isActive
          ? 'h-16 bg-blue-500/30 border-2 border-blue-500 border-dashed rounded'
          : 'h-10 bg-zinc-800/20 hover:bg-zinc-700/30 border-t-2 border-dashed border-zinc-600/50'
      }`}
    >
      <button
        onClick={onAddSection}
        className="text-xs text-zinc-500 hover:text-zinc-400 px-3 py-1 border border-dashed border-zinc-600 rounded hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-800"
      >
        + Add Section Here
      </button>
    </div>
  );
};

/** ---------- Main SongEditor Component ---------- */

export const SongEditor: React.FC<SongEditorProps> = ({ song, isEditing }) => {
  const dispatch = useAppDispatch();
  const focusedInstruments = useAppSelector((state) => state.preferences.instrumentFocus);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingTempo, setIsEditingTempo] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(song.title);
  const [tempTempo, setTempTempo] = useState(song.tempo.toString());
  const [tempDescription, setTempDescription] = useState(song.description || '');

  // Sync local state with song prop when switching between songs
  useEffect(() => {
    setTempTitle(song.title);
    setTempTempo(song.tempo.toString());
    setTempDescription(song.description || '');
  }, [song.id]);

  // Reset editing states when switching songs
  useEffect(() => {
    setIsEditingTitle(false);
    setIsEditingTempo(false);
    setIsEditingDescription(false);
  }, [song.id]);

  const handleAddSection = (index?: number) => {
    const sectionNumber = song.sections.length + 1;
    dispatch(addSection({
      songId: song.id,
      name: `Section ${sectionNumber}`,
      index,
      focusedInstruments,
    }));
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      dispatch(updateSongMetadata({
        id: song.id,
        title: tempTitle.trim(),
      }));
    }
    setIsEditingTitle(false);
  };

  const handleSaveTempo = () => {
    const tempo = parseInt(tempTempo);
    if (tempo > 0 && tempo <= 300) {
      dispatch(updateSongMetadata({
        id: song.id,
        tempo,
      }));
    }
    setIsEditingTempo(false);
  };

  const handleSaveDescription = () => {
    dispatch(updateSongMetadata({
      id: song.id,
      description: tempDescription.trim() || undefined,
    }));
    setIsEditingDescription(false);
  };

  const handleLinksChange = (links: string[]) => {
    console.log('handleLinksChange', links);
    dispatch(updateSongMetadata({
      id: song.id,
      links: links.length > 0 ? links : [],
    }));
  };

  return (
    <div className="px-2 sm:px-4 space-y-4 sm:space-y-6 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex-1">
          {isEditing && isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setTempTitle(song.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="text-xl sm:text-2xl font-bold bg-zinc-800 text-zinc-100 px-2 sm:px-3 py-1 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none w-full"
            />
          ) : (
            <h2
              className={`text-xl sm:text-2xl font-bold text-zinc-100 ${
                isEditing ? 'cursor-pointer hover:text-blue-400' : ''
              }`}
              onClick={() => isEditing && setIsEditingTitle(true)}
            >
              {song.title}
            </h2>
          )}

          {isEditing && isEditingTempo ? (
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
              <span className="text-xs sm:text-sm text-zinc-500">♩ =</span>
              <input
                type="number"
                value={tempTempo}
                onChange={(e) => setTempTempo(e.target.value)}
                onBlur={handleSaveTempo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTempo();
                  if (e.key === 'Escape') {
                    setTempTempo(song.tempo.toString());
                    setIsEditingTempo(false);
                  }
                }}
                placeholder="BPM"
                min="1"
                max="300"
                autoFocus
                className="w-16 sm:w-20 text-xs sm:text-sm bg-zinc-800 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none"
              />
              <span className="text-xs sm:text-sm text-zinc-500">BPM</span>
            </div>
          ) : (
            <p
              className={`text-xs sm:text-sm text-zinc-500 ${
                isEditing ? 'cursor-pointer hover:text-zinc-400' : ''
              }`}
              onClick={() => isEditing && setIsEditingTempo(true)}
            >
              ♩ = {song.tempo} BPM
            </p>
          )}

          {/* Description */}
          {isEditing && isEditingDescription ? (
            <div className="mt-2">
              <textarea
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onBlur={handleSaveDescription}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setTempDescription(song.description || '');
                    setIsEditingDescription(false);
                  }
                }}
                placeholder="Add a description..."
                rows={3}
                autoFocus
                className="w-full text-xs sm:text-sm bg-zinc-800 text-zinc-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          ) : (
            <>
              {song.description && !isEditing ? (
                <p className="text-xs sm:text-sm text-zinc-400 mt-2">{song.description}</p>
              ) : isEditing ? (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="mt-2 text-[10px] sm:text-xs text-zinc-500 hover:text-zinc-400 px-1.5 sm:px-2 py-0.5 sm:py-1 border border-dashed border-zinc-600 rounded"
                >
                  {song.description ? 'Edit description' : '+ Add description or lyrics'}
                </button>
              ) : null}
            </>
          )}

          {/* Links */}
          <div className="mt-3">
            <LinkEditor
              links={song.links || []}
              onLinksChange={handleLinksChange}
              editable={isEditing}
            />
          </div>
        </div>
      </header>

      {/* Sections */}
      <div className={isEditing ? 'space-y-3 sm:space-y-4' : 'space-y-6 sm:space-y-8'}>
        {song.sections.map((section, idx) => (
          <React.Fragment key={section.id}>
            {/* Section Drop Zone / Add Button (only in edit mode) */}
            {isEditing && (
              <SectionDropZone
                songId={song.id}
                targetIndex={idx}
                onAddSection={() => handleAddSection(idx)}
              />
            )}

            {/* Section with drag handle */}
            <div
              draggable={isEditing}
              onDragStart={(e) => {
                if (!isEditing) return;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('application/json', JSON.stringify({
                  sectionId: section.id,
                  songId: song.id,
                }));
              }}
              className={isEditing ? 'cursor-move' : ''}
            >
              <SectionView
                section={section}
                songId={song.id}
                editable={isEditing}
                canRemove={song.sections.length > 1}
              />
            </div>
          </React.Fragment>
        ))}

        {/* Drop zone after all sections */}
        {isEditing && (
          <SectionDropZone
            songId={song.id}
            targetIndex={song.sections.length}
            onAddSection={() => handleAddSection(song.sections.length)}
          />
        )}
      </div>
    </div>
  );
};
