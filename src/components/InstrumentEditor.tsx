/**
 * Instrument Editor Modal
 * Full-screen modal for creating and editing instrument configurations
 */

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { addInstrument, updateInstrument } from '../store/instrumentsSlice';
import { InstrumentConfig } from '../types';
import { validateInstrumentConfig } from '../utils/instrumentValidation';

interface InstrumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: InstrumentConfig | null;
}

// Common Tailwind color options for note colors
const COMMON_NOTE_COLORS = [
  { name: 'Zinc', value: 'text-zinc-500' },
  { name: 'Red', value: 'text-red-300' },
  { name: 'Orange', value: 'text-orange-300' },
  { name: 'Amber', value: 'text-amber-300' },
  { name: 'Yellow', value: 'text-yellow-300' },
  { name: 'Lime', value: 'text-lime-300' },
  { name: 'Green', value: 'text-green-300' },
  { name: 'Emerald', value: 'text-emerald-300' },
  { name: 'Teal', value: 'text-teal-300' },
  { name: 'Cyan', value: 'text-cyan-300' },
  { name: 'Sky', value: 'text-sky-300' },
  { name: 'Blue', value: 'text-blue-300' },
  { name: 'Indigo', value: 'text-indigo-300' },
  { name: 'Violet', value: 'text-violet-300' },
  { name: 'Purple', value: 'text-purple-300' },
  { name: 'Fuchsia', value: 'text-fuchsia-300' },
  { name: 'Pink', value: 'text-pink-300' },
  { name: 'Rose', value: 'text-rose-300' },
  { name: 'Gray', value: 'text-gray-400' },
];

// Instrument color options (500 shade for better visibility)
const INSTRUMENT_COLORS = [
  { name: 'Emerald', value: 'text-emerald-500' },
  { name: 'Yellow', value: 'text-yellow-500' },
  { name: 'Orange', value: 'text-orange-500' },
  { name: 'Red', value: 'text-red-500' },
  { name: 'Pink', value: 'text-pink-500' },
  { name: 'Purple', value: 'text-purple-500' },
  { name: 'Blue', value: 'text-blue-500' },
  { name: 'Cyan', value: 'text-cyan-500' },
  { name: 'Teal', value: 'text-teal-500' },
  { name: 'Green', value: 'text-green-500' },
  { name: 'Lime', value: 'text-lime-500' },
  { name: 'Amber', value: 'text-amber-500' },
  { name: 'Rose', value: 'text-rose-500' },
  { name: 'Fuchsia', value: 'text-fuchsia-500' },
  { name: 'Violet', value: 'text-violet-500' },
  { name: 'Indigo', value: 'text-indigo-500' },
  { name: 'Sky', value: 'text-sky-500' },
  { name: 'Zinc', value: 'text-zinc-400' },
];

interface NoteConfig {
  character: string;
  label: string;
  color: string;
  symbol?: string;
}

export const InstrumentEditor: React.FC<InstrumentEditorProps> = ({
  isOpen,
  onClose,
  initialConfig,
}) => {
  const dispatch = useAppDispatch();
  const instruments = useAppSelector(state => state.instruments.instruments);
  const isEditing = !!initialConfig;

  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instrumentColor, setInstrumentColor] = useState('text-emerald-500');
  const [notes, setNotes] = useState<NoteConfig[]>([]);
  const [cycleOrder, setCycleOrder] = useState<string[]>([]);
  const [flamNotes, setFlamNotes] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialConfig) {
      setKey(initialConfig.key);
      setName(initialConfig.name);
      setDescription(initialConfig.description || '');
      setInstrumentColor(initialConfig.color || 'text-emerald-500');

      // Convert to NoteConfig format
      const noteConfigs: NoteConfig[] = initialConfig.availableNotes.map(char => ({
        character: char,
        label: initialConfig.noteLabels[char] || char,
        color: initialConfig.noteColors[char] || 'text-zinc-500',
        symbol: initialConfig.noteSymbols?.[char],
      }));
      setNotes(noteConfigs);
      setCycleOrder(initialConfig.cycleOrder);
      setFlamNotes(initialConfig.flamNotes);
    } else {
      // Default for new instrument
      setKey('');
      setName('');
      setDescription('');
      setInstrumentColor('text-emerald-500');
      setNotes([{ character: '.', label: 'Rest', color: 'text-zinc-500', symbol: '·' }]);
      setCycleOrder(['.']);
      setFlamNotes([]);
    }
    setErrors([]);
  }, [initialConfig, isOpen]);

  const handleAddNote = () => {
    setNotes([...notes, { character: '', label: '', color: 'text-zinc-500' }]);
  };

  const handleRemoveNote = (index: number) => {
    const noteChar = notes[index].character;
    setNotes(notes.filter((_, i) => i !== index));
    setCycleOrder(cycleOrder.filter(c => c !== noteChar));
    setFlamNotes(flamNotes.filter(c => c !== noteChar));
  };

  const handleNoteChange = (index: number, field: keyof NoteConfig, value: string) => {
    const newNotes = [...notes];
    const oldChar = newNotes[index].character;
    newNotes[index] = { ...newNotes[index], [field]: value };
    setNotes(newNotes);

    // Update cycle order and flam notes if character changed
    if (field === 'character' && oldChar !== value) {
      setCycleOrder(cycleOrder.map(c => c === oldChar ? value : c));
      setFlamNotes(flamNotes.map(c => c === oldChar ? value : c));
    }
  };

  const handleToggleFlamNote = (char: string) => {
    if (flamNotes.includes(char)) {
      setFlamNotes(flamNotes.filter(c => c !== char));
    } else {
      setFlamNotes([...flamNotes, char]);
    }
  };

  const handleSave = () => {
    // Build the config
    const availableNotes = notes.map(n => n.character).filter(c => c.length > 0);
    const noteLabels: Record<string, string> = {};
    const noteColors: Record<string, string> = {};
    const noteSymbols: Record<string, string> = {};

    notes.forEach(note => {
      if (note.character) {
        noteLabels[note.character] = note.label || note.character;
        noteColors[note.character] = note.color;
        if (note.symbol && note.symbol !== note.character) {
          noteSymbols[note.character] = note.symbol;
        }
      }
    });

    // Use cycleOrder if valid, otherwise default to availableNotes order
    const finalCycleOrder = cycleOrder.length === availableNotes.length
      ? cycleOrder
      : availableNotes;

    // For new instruments, set displayOrder to be after all existing instruments
    const displayOrder = isEditing
      ? initialConfig.displayOrder
      : Math.max(0, ...instruments.map(i => i.displayOrder)) + 1;

    const config: InstrumentConfig = {
      key: isEditing ? initialConfig.key : key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
      name: name.trim(),
      description: description.trim() || undefined,
      color: instrumentColor,
      displayOrder,
      availableNotes,
      cycleOrder: finalCycleOrder,
      noteLabels,
      noteColors,
      noteSymbols: Object.keys(noteSymbols).length > 0 ? noteSymbols : undefined,
      flamNotes: flamNotes.filter(c => availableNotes.includes(c)),
      created: initialConfig?.created || new Date().toISOString(),
      modified: new Date().toISOString(),
    };

    // Validate
    const validation = validateInstrumentConfig(config);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Save
    if (isEditing) {
      dispatch(updateInstrument({ key: config.key, updates: config }));
    } else {
      dispatch(addInstrument(config));
    }

    onClose();
  };

  const handleSyncCycleOrder = () => {
    const availableChars = notes.map(n => n.character).filter(c => c.length > 0);
    setCycleOrder(availableChars);
  };

  if (!isOpen) return null;

  const availableChars = notes.map(n => n.character).filter(c => c.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-100">
            {isEditing ? `Edit Instrument: ${initialConfig?.name}` : 'Add New Instrument'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errors.length > 0 && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded space-y-1">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-red-300">{error}</p>
              ))}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">
              Basic Information
            </h3>

            {!isEditing && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Instrument Key (unique identifier)
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g., djembe, conga, tabla"
                  className="w-full px-3 py-2 bg-zinc-800 text-zinc-100 border border-zinc-600 rounded focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Lowercase letters, numbers, hyphens, and underscores only
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Djembe"
                className="w-full px-3 py-2 bg-zinc-800 text-zinc-100 border border-zinc-600 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this instrument"
                rows={2}
                className="w-full px-3 py-2 bg-zinc-800 text-zinc-100 border border-zinc-600 rounded focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Instrument Color</label>
              <select
                value={instrumentColor}
                onChange={(e) => setInstrumentColor(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 text-zinc-100 border border-zinc-600 rounded focus:border-blue-500 focus:outline-none"
              >
                {INSTRUMENT_COLORS.map(color => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 mt-1">
                Color for instrument label and track chips
              </p>
            </div>
          </div>

          {/* Notes Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
              <h3 className="text-sm font-semibold text-zinc-300">Available Notes</h3>
              <button
                onClick={handleAddNote}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
              >
                + Add Note
              </button>
            </div>

            <div className="space-y-2">
              {notes.map((note, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-zinc-800 rounded border border-zinc-700">
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Character</label>
                      <input
                        type="text"
                        maxLength={1}
                        value={note.character}
                        onChange={(e) => handleNoteChange(index, 'character', e.target.value)}
                        className="w-full px-2 py-1 bg-zinc-700 text-zinc-100 border border-zinc-600 rounded text-center text-lg font-mono"
                        placeholder="X"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Label</label>
                      <input
                        type="text"
                        value={note.label}
                        onChange={(e) => handleNoteChange(index, 'label', e.target.value)}
                        className="w-full px-2 py-1 bg-zinc-700 text-zinc-100 border border-zinc-600 rounded text-sm"
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Color</label>
                      <select
                        value={note.color}
                        onChange={(e) => handleNoteChange(index, 'color', e.target.value)}
                        className="w-full px-2 py-1 bg-zinc-700 text-zinc-100 border border-zinc-600 rounded text-sm"
                      >
                        {COMMON_NOTE_COLORS.map(color => (
                          <option key={color.value} value={color.value}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Symbol (opt)</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={note.symbol || ''}
                        onChange={(e) => handleNoteChange(index, 'symbol', e.target.value)}
                        className="w-full px-2 py-1 bg-zinc-700 text-zinc-100 border border-zinc-600 rounded text-sm"
                        placeholder={note.character}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveNote(index)}
                    className="mt-6 px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded"
                    title="Remove note"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cycle Order */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
              <h3 className="text-sm font-semibold text-zinc-300">Cycle Order</h3>
              <button
                onClick={handleSyncCycleOrder}
                className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
              >
                Auto-sync with notes
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Order in which notes cycle when clicking. Current: {cycleOrder.join(' → ')}
            </p>
          </div>

          {/* Flam Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">
              Flam-Compatible Notes
            </h3>
            <p className="text-xs text-zinc-500">
              Select which notes can be used in flams (grace and main notes)
            </p>
            <div className="flex flex-wrap gap-2">
              {availableChars.map(char => (
                <button
                  key={char}
                  onClick={() => handleToggleFlamNote(char)}
                  className={`px-3 py-1.5 rounded text-sm font-semibold ${
                    flamNotes.includes(char)
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                  }`}
                >
                  {char}
                </button>
              ))}
              {availableChars.length === 0 && (
                <p className="text-sm text-zinc-500">Add notes first</p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
          >
            {isEditing ? 'Save Changes' : 'Create Instrument'}
          </button>
        </div>
      </div>
    </div>
  );
};
