import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import {
  Song,
  Section,
  Measure,
  InstrumentTrack,
  Note,
  InstrumentType,
  DjembeNote,
  DunDunNote,
  FlamType,
  getSubdivisionsPerBeat,
  isFlam,
  formatFlam,
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
  updateSongMetadata,
} from "../store/songsSlice";

/** ---------- Types ---------- */

interface SongEditorProps {
  song: Song;
  isEditing: boolean;
}

/** ---------- Helper Functions ---------- */

// Get the next note in the cycle for the given instrument
function getNextNote(current: Note, instrument: InstrumentType): Note {
  if (instrument === 'djembe') {
    const djembeCycle: Record<string, DjembeNote> = {
      '.': 'B',
      'B': 'T',
      'T': 'S',
      'S': '^',
      '^': '.',
    };

    if (isFlam(current)) {
      return '.';
    }

    return djembeCycle[current as string] || '.';
  } else {
    // Dun dun instruments (sangban, kenkeni, dundunba)
    const dunDunCycle: Record<string, DunDunNote> = {
      '.': 'O',
      'O': 'M',
      'M': '.',
    };

    if (isFlam(current)) {
      return '.';
    }

    return dunDunCycle[current as string] || '.';
  }
}

// Get symbol to display for a note
function symbolFor(note: Note): string {
  if (isFlam(note)) {
    return formatFlam(note);
  }

  if (note === '.') return '·';
  return note;
}

// Get color class for a note
function getColorClass(note: Note, instrument: InstrumentType): string {
  if (isFlam(note)) {
    // Open flams use brighter purple, closed flams use regular purple
    return note.open ? 'text-purple-200' : 'text-purple-300';
  }

  // Check if it's a djembe note or dun dun note based on the value
  const isDjembe = typeof note === 'string' && ['B', 'T', 'S', '^'].includes(note);
  const isDunDun = typeof note === 'string' && ['O', 'M'].includes(note);

  if (isDjembe || instrument === 'djembe') {
    switch (note) {
      case 'B': return 'text-emerald-300';
      case 'T': return 'text-sky-300';
      case 'S': return 'text-orange-300';
      case '^': return 'text-fuchsia-300';
      case '.': return 'text-zinc-500';
      default: return 'text-zinc-500';
    }
  } else if (isDunDun || ['sangban', 'kenkeni', 'dundunba', 'kenken'].includes(instrument)) {
    // Dun dun instruments and cowbell
    switch (note) {
      case 'O': return instrument === 'kenken' ? 'text-cyan-300' : 'text-yellow-300';
      case 'M': return 'text-gray-400';
      case '.': return 'text-zinc-500';
      default: return 'text-zinc-500';
    }
  }

  return 'text-zinc-500';
}

// Get subdivision labels
function getSubdivisionLabels(divisionType: 'sixteenth' | 'triplet' | 'mixed'): string[] {
  switch (divisionType) {
    case 'triplet':
      return ['1', 'la', 'le'];
    case 'sixteenth':
    case 'mixed':
    default:
      return ['1', 'e', '&', 'a'];
  }
}

// Get instrument display name
function getInstrumentName(instrument: InstrumentType): string {
  switch (instrument) {
    case 'djembe': return 'Djembe';
    case 'sangban': return 'Sangban';
    case 'kenkeni': return 'Kenkeni';
    case 'dundunba': return 'Dundunba';
    case 'kenken': return 'Kenken (Bell)';
  }
}

/** ---------- NotePickerDialog Component ---------- */

interface NotePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentNote: Note;
  instrument: InstrumentType;
  onSelectNote: (note: Note) => void;
  position: { x: number; y: number };
}

const NotePickerDialog: React.FC<NotePickerDialogProps> = ({
  isOpen,
  onClose,
  currentNote,
  instrument,
  onSelectNote,
  position,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Flam builder state - default to tS (Tone grace, Slap main, closed)
  const [flamGrace, setFlamGrace] = useState<DjembeNote>('T');
  const [flamMain, setFlamMain] = useState<DjembeNote>('S');
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
      setFlamGrace(currentNote.grace);
      setFlamMain(currentNote.main);
      setFlamOpen(currentNote.open || false);
    } else {
      setFlamGrace('T');
      setFlamMain('S');
      setFlamOpen(false);
    }
  }, [currentNote]);

  if (!isOpen) return null;

  const handleSelect = (note: Note) => {
    onSelectNote(note);
    onClose();
  };

  const handleCreateFlam = () => {
    const flam: FlamType = {
      type: 'flam',
      grace: flamGrace,
      main: flamMain,
      open: flamOpen,
    };
    handleSelect(flam);
  };

  // Available notes for flam components (no rest or accent for grace notes)
  const djembeBasicNotes: DjembeNote[] = ['.', 'B', 'T', 'S', '^'];
  const flamNoteOptions: DjembeNote[] = ['B', 'T', 'S', '^'];

  // Helper to get note label
  const getNoteLabel = (note: DjembeNote): string => {
    switch (note) {
      case 'B': return 'Bass';
      case 'T': return 'Tone';
      case 'S': return 'Slap';
      case '^': return 'Accent';
      default: return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        ref={dialogRef}
        className="bg-zinc-800 rounded-lg border border-zinc-600 shadow-xl p-4 min-w-[320px] max-w-md"
        style={{
          position: 'absolute',
          left: Math.min(position.x, window.innerWidth - 350),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
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

        {instrument === 'djembe' ? (
          <div className="space-y-4">
            {/* Basic Notes Grid */}
            <div>
              <label className="text-xs text-zinc-400 mb-2 block">Basic Notes</label>
              <div className="grid grid-cols-5 gap-2">
                {djembeBasicNotes.map((note) => (
                  <button
                    key={note}
                    onClick={() => handleSelect(note)}
                    className={`px-3 py-2 rounded text-sm font-semibold ${
                      currentNote === note
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    } ${getColorClass(note, 'djembe')}`}
                    title={note === '.' ? 'Rest' : getNoteLabel(note)}
                  >
                    {note === '.' ? '·' : note}
                  </button>
                ))}
              </div>
            </div>

            {/* Flam Builder */}
            <div className="space-y-3 pt-2 border-t border-zinc-700">
              <label className="text-xs text-zinc-400 block">Flam Builder</label>

              {/* Grace Note Selector */}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Grace Note (leading)</label>
                <div className="grid grid-cols-4 gap-2">
                  {flamNoteOptions.map((note) => (
                    <button
                      key={`grace-${note}`}
                      onClick={() => setFlamGrace(note)}
                      className={`px-3 py-2 rounded text-sm font-semibold ${
                        flamGrace === note
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-700 hover:bg-zinc-600'
                      } ${getColorClass(note, 'djembe')}`}
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
                  {flamNoteOptions.map((note) => (
                    <button
                      key={`main-${note}`}
                      onClick={() => setFlamMain(note)}
                      className={`px-3 py-2 rounded text-sm font-semibold ${
                        flamMain === note
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-700 hover:bg-zinc-600'
                      } ${getColorClass(note, 'djembe')}`}
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
                    {formatFlam({ type: 'flam', grace: flamGrace, main: flamMain, open: flamOpen })}
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
          </div>
        ) : (
          // Dun Dun instruments (simple notes only, no flams)
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">Notes</label>
            <div className="grid grid-cols-3 gap-2">
              {['.', 'O', 'M'].map((note) => (
                <button
                  key={note}
                  onClick={() => handleSelect(note as Note)}
                  className={`px-3 py-2 rounded text-sm font-semibold ${
                    currentNote === note
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  } ${getColorClass(note as Note, instrument)}`}
                >
                  {note === '.' ? '·' : note}
                </button>
              ))}
            </div>
          </div>
        )}
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
  const subdivisions = getSubdivisionsPerBeat(measure.timeSignature.divisionType);
  const beats = measure.timeSignature.beats;

  const [notePickerState, setNotePickerState] = useState<{
    isOpen: boolean;
    noteIndex: number;
    position: { x: number; y: number };
  }>({ isOpen: false, noteIndex: -1, position: { x: 0, y: 0 } });

  const longPressTimerRef = useRef<any | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleCellClick = (index: number) => {
    if (!editable) return;

    const newNotes = [...track.notes];
    newNotes[index] = getNextNote(newNotes[index], track.instrument);

    dispatch(updateTrackNotes({
      songId,
      sectionId,
      measureId: measure.id,
      trackId: track.id,
      notes: newNotes,
    }));
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
    const newNotes = [...track.notes];
    newNotes[notePickerState.noteIndex] = note;

    dispatch(updateTrackNotes({
      songId,
      sectionId,
      measureId: measure.id,
      trackId: track.id,
      notes: newNotes,
    }));
  };

  const handleRemoveTrack = () => {
    dispatch(removeTrack({
      songId,
      sectionId,
      measureId: measure.id,
      trackId: track.id,
    }));
  };

  return (
    <>
      <div className="border-t border-zinc-600 first:border-t-0">
        <div className="flex items-center justify-between px-2 py-1 bg-zinc-800/30">
          <span className="text-xs text-zinc-400">
            {getInstrumentName(track.instrument)}
            {track.label && ` - ${track.label}`}
          </span>
          {editable && canRemove && (
            <button
              onClick={handleRemoveTrack}
              className="text-red-400 hover:text-red-300 text-sm"
              title="Remove track"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex">
          {Array.from({ length: beats }).map((_, beatIdx) => (
            <div key={beatIdx} className="flex">
              {track.notes
                .slice(beatIdx * subdivisions, (beatIdx + 1) * subdivisions)
                .map((note, subIdx) => {
                  const globalIdx = beatIdx * subdivisions + subIdx;
                  return (
                    <div
                      key={globalIdx}
                      onMouseDown={(e) => handleMouseDown(globalIdx, e)}
                      onMouseUp={() => handleMouseUp(globalIdx)}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={(e) => handleTouchStart(globalIdx, e)}
                      onTouchEnd={() => handleTouchEnd(globalIdx)}
                      className={[
                        'h-8 w-10 flex items-center justify-center text-sm font-semibold',
                        'border-r border-b border-zinc-600',
                        editable ? 'cursor-pointer hover:bg-zinc-700/60' : '',
                        getColorClass(note, track.instrument),
                      ].join(' ')}
                      title={
                        isFlam(note)
                          ? `${note.open ? 'Open' : 'Closed'} Flam: ${note.grace} to ${note.main}`
                          : note === '.'
                          ? 'rest'
                          : note
                      }
                    >
                      {symbolFor(note)}
                    </div>
                  );
                })}
              {beatIdx < beats - 1 && (
                <div className="w-1 bg-zinc-800" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Note Picker Dialog */}
      {notePickerState.isOpen && notePickerState.noteIndex >= 0 && (
        <NotePickerDialog
          isOpen={notePickerState.isOpen}
          onClose={() => setNotePickerState({ ...notePickerState, isOpen: false })}
          currentNote={track.notes[notePickerState.noteIndex]}
          instrument={track.instrument}
          onSelectNote={handleNoteSelect}
          position={notePickerState.position}
        />
      )}
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
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [showTimeSignature, setShowTimeSignature] = useState(false);
  const beats = measure.timeSignature.beats;
  const subLabels = getSubdivisionLabels(measure.timeSignature.divisionType);

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

  const handleAddTrack = (instrument: InstrumentType) => {
    dispatch(addTrack({
      songId,
      sectionId,
      measureId: measure.id,
      instrument,
    }));
    setShowAddTrack(false);
  };

  const handleTimeSignatureChange = (beats: number, divisionType: 'sixteenth' | 'triplet') => {
    dispatch(updateMeasureTimeSignature({
      songId,
      sectionId,
      measureId: measure.id,
      timeSignature: {
        beats,
        division: 4,
        divisionType,
      },
    }));
    setShowTimeSignature(false);
  };

  const currentDivisionType = measure.timeSignature.divisionType === 'mixed'
    ? 'sixteenth'
    : measure.timeSignature.divisionType;

  return (
    <div
      draggable={editable}
      onDragStart={handleDragStart}
      className={`bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden min-w-fit ${
        editable ? 'cursor-move' : ''
      }`}
    >
      {/* Measure Header */}
      <div className="px-3 py-2 bg-zinc-800/50 flex items-center justify-between border-b border-zinc-700 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-300">
            Measure {measureIndex + 1}
          </span>
          {editable ? (
            <button
              onClick={() => setShowTimeSignature(!showTimeSignature)}
              className="text-xs text-zinc-400 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-600 hover:border-zinc-500"
            >
              {beats}/4 · {measure.timeSignature.divisionType}
            </button>
          ) : (
            <span className="text-xs text-zinc-500">
              {beats}/4 · {measure.timeSignature.divisionType}
            </span>
          )}
        </div>
        {editable && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDuplicateMeasure}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium px-2 py-1 rounded border border-blue-600/30 hover:border-blue-500/50"
              title="Duplicate measure"
            >
              ⎘
            </button>
            {canRemove && (
              <button
                onClick={handleRemoveMeasure}
                className="text-red-400 hover:text-red-300 text-lg font-bold"
                title="Remove measure"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* Time Signature Editor */}
      {editable && showTimeSignature && (
        <div className="px-3 py-2 bg-zinc-800/30 border-b border-zinc-700">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-zinc-400">Beats:</span>
            {[2, 3, 4, 6].map((b) => (
              <button
                key={b}
                onClick={() => handleTimeSignatureChange(b, currentDivisionType)}
                className={`px-2 py-1 text-xs rounded ${
                  beats === b
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                }`}
              >
                {b}
              </button>
            ))}
            <span className="text-xs text-zinc-400 ml-2">Division:</span>
            <button
              onClick={() => handleTimeSignatureChange(beats, 'sixteenth')}
              className={`px-2 py-1 text-xs rounded ${
                measure.timeSignature.divisionType === 'sixteenth'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
              }`}
            >
              16ths
            </button>
            <button
              onClick={() => handleTimeSignatureChange(beats, 'triplet')}
              className={`px-2 py-1 text-xs rounded ${
                measure.timeSignature.divisionType === 'triplet'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
              }`}
            >
              Triplets
            </button>
          </div>
        </div>
      )}

      {/* Subdivision Labels */}
      <div className="flex border-b border-zinc-700 bg-zinc-900/50">
        {Array.from({ length: beats }).map((_, beatIdx) => (
          <div key={beatIdx} className="flex">
            {subLabels.map((lbl, subIdx) => (
              <div
                key={`${beatIdx}-${subIdx}`}
                className={[
                  'h-6 w-10 flex items-center justify-center text-xs',
                  'border-r border-zinc-600',
                  lbl === '1' ? 'font-bold text-zinc-300' : 'text-zinc-500',
                ].join(' ')}
              >
                {lbl === '1' ? beatIdx + 1 : lbl}
              </div>
            ))}
            {beatIdx < beats - 1 && (
              <div className="w-1" />
            )}
          </div>
        ))}
      </div>

      {/* Instrument Tracks */}
      {measure.tracks.map((track) => (
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
              <button
                onClick={() => handleAddTrack('djembe')}
                className="px-2 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 rounded"
              >
                Djembe
              </button>
              <button
                onClick={() => handleAddTrack('sangban')}
                className="px-2 py-1 text-xs bg-yellow-700 hover:bg-yellow-600 rounded"
              >
                Sangban
              </button>
              <button
                onClick={() => handleAddTrack('kenkeni')}
                className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 rounded"
              >
                Kenkeni
              </button>
              <button
                onClick={() => handleAddTrack('dundunba')}
                className="px-2 py-1 text-xs bg-yellow-800 hover:bg-yellow-700 rounded"
              >
                Dundunba
              </button>
              <button
                onClick={() => handleAddTrack('kenken')}
                className="px-2 py-1 text-xs bg-cyan-700 hover:bg-cyan-600 rounded"
              >
                Kenken
              </button>
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingTempo, setIsEditingTempo] = useState(false);
  const [tempName, setTempName] = useState(section.name);
  const [tempTempo, setTempTempo] = useState(section.tempo?.toString() || '');

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

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
              className={`text-sm font-semibold text-zinc-300 ${
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

      {/* Measures Grid */}
      <div className={editable ? 'space-y-2' : 'flex flex-wrap gap-4'}>
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

      {/* Variants (if any) */}
      {section.variants && section.variants.length > 0 && (
        <div className="ml-8 space-y-4 border-l-2 border-zinc-700 pl-4">
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

  return (
    <div className="space-y-6 text-zinc-100">
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
              className="text-2xl font-bold bg-zinc-800 text-zinc-100 px-3 py-1 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <h2
              className={`text-2xl font-bold text-zinc-100 ${
                isEditing ? 'cursor-pointer hover:text-blue-400' : ''
              }`}
              onClick={() => isEditing && setIsEditingTitle(true)}
            >
              {song.title}
            </h2>
          )}

          {isEditing && isEditingTempo ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-zinc-500">♩ =</span>
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
                className="w-20 text-sm bg-zinc-800 text-zinc-100 px-2 py-1 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none"
              />
              <span className="text-sm text-zinc-500">BPM</span>
            </div>
          ) : (
            <p
              className={`text-sm text-zinc-500 ${
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
                className="w-full text-sm bg-zinc-800 text-zinc-100 px-3 py-2 rounded border border-zinc-600 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          ) : (
            <>
              {song.description && !isEditing ? (
                <p className="text-sm text-zinc-400 mt-2">{song.description}</p>
              ) : isEditing ? (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="mt-2 text-xs text-zinc-500 hover:text-zinc-400 px-2 py-1 border border-dashed border-zinc-600 rounded"
                >
                  {song.description ? 'Edit description' : '+ Add description or lyrics'}
                </button>
              ) : null}
            </>
          )}
        </div>
      </header>

      {/* Sections */}
      <div className={isEditing ? 'space-y-4' : 'space-y-8'}>
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
