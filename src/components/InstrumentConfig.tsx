/**
 * Instrument Configuration Management Component
 * Allows users to view, add, edit, delete, and import/export instruments
 */

import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { removeInstrument, importInstrument, reorderInstruments, resetToDefaults } from '../store/instrumentsSlice';
import { InstrumentConfig } from '../types';
import { exportInstrument, importInstrumentFromJSON } from '../store/instrumentPersistence';
import { isInstrumentUsedInSongs, findSongsUsingInstrument } from '../utils/instrumentValidation';
import { DEFAULT_INSTRUMENTS } from '../assets/defaultInstruments';

interface InstrumentConfigProps {
  onEditInstrument: (config: InstrumentConfig) => void;
  onAddInstrument: () => void;
}

export const InstrumentConfigComponent: React.FC<InstrumentConfigProps> = ({
  onEditInstrument,
  onAddInstrument,
}) => {
  const dispatch = useAppDispatch();
  const instruments = useAppSelector(state => state.instruments.instruments);
  const songs = useAppSelector(state => state.songs.songs);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sort instruments by displayOrder
  const sortedInstruments = [...instruments].sort((a, b) => a.displayOrder - b.displayOrder);

  // Check if current instruments match defaults (ignoring modified/created dates)
  const instrumentsMatchDefaults = useMemo(() => {
    if (instruments.length !== DEFAULT_INSTRUMENTS.length) return false;

    // Check each default instrument
    return DEFAULT_INSTRUMENTS.every(defaultInst => {
      const currentInst = instruments.find(i => i.key === defaultInst.key);
      if (!currentInst) return false;

      // Compare all fields except created and modified
      return (
        currentInst.name === defaultInst.name &&
        currentInst.description === defaultInst.description &&
        currentInst.color === defaultInst.color &&
        currentInst.displayOrder === defaultInst.displayOrder &&
        JSON.stringify(currentInst.availableNotes) === JSON.stringify(defaultInst.availableNotes) &&
        JSON.stringify(currentInst.cycleOrder) === JSON.stringify(defaultInst.cycleOrder) &&
        JSON.stringify(currentInst.noteLabels) === JSON.stringify(defaultInst.noteLabels) &&
        JSON.stringify(currentInst.noteColors) === JSON.stringify(defaultInst.noteColors) &&
        JSON.stringify(currentInst.noteSymbols) === JSON.stringify(defaultInst.noteSymbols) &&
        JSON.stringify(currentInst.flamNotes) === JSON.stringify(defaultInst.flamNotes)
      );
    });
  }, [instruments]);

  const handleExport = (config: InstrumentConfig) => {
    const json = exportInstrument(config);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.key}-instrument.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const result = importInstrumentFromJSON(json);

          if (!result.success || !result.instrument) {
            setError(result.error || 'Failed to import instrument');
            return;
          }

          // Check if instrument with this key already exists
          const existing = instruments.find(i => i.key === result.instrument!.key);
          if (existing) {
            const confirmed = window.confirm(
              `An instrument with key "${result.instrument.key}" already exists. Replace it?`
            );
            if (!confirmed) return;
          }

          dispatch(importInstrument(result.instrument));
          setError('');
        } catch (err) {
          setError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDelete = (config: InstrumentConfig) => {
    // Check if instrument is used in any songs
    const isUsed = isInstrumentUsedInSongs(config.key, songs);

    if (isUsed) {
      const usedInSongs = findSongsUsingInstrument(config.key, songs);
      const songNames = usedInSongs.map(s => s.title).join(', ');
      const confirmed = window.confirm(
        `Warning: This instrument is used in the following songs: ${songNames}\n\n` +
        `If you delete it, those tracks will show as "Unknown (${config.key})".\n\n` +
        `Are you sure you want to delete "${config.name}"?`
      );
      if (!confirmed) return;
    }

    if (deleteConfirm === config.key) {
      dispatch(removeInstrument(config.key));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(config.key);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const reordered = [...sortedInstruments];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, removed);

    dispatch(reorderInstruments(reordered));
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleResetToDefaults = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all instruments to their default configurations?\n\n' +
      'This will:\n' +
      '• Delete all custom instruments\n' +
      '• Reset all modified instruments to their original state\n' +
      '• Restore the original 5 default instruments\n\n' +
      'This action cannot be undone!'
    );

    if (confirmed) {
      dispatch(resetToDefaults());
      setError('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Instruments</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Manage instrument configurations and their available notes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetToDefaults}
            disabled={instrumentsMatchDefaults}
            className={`px-3 py-1.5 text-xs rounded ${
              instrumentsMatchDefaults
                ? 'bg-zinc-700 text-zinc-500 border border-zinc-600 cursor-not-allowed'
                : 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700'
            }`}
            title={instrumentsMatchDefaults ? 'Instruments already match defaults' : 'Reset all instruments to factory defaults'}
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded"
          >
            Import
          </button>
          <button
            onClick={onAddInstrument}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
          >
            + Add Instrument
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {sortedInstruments.map((config, index) => (
          <div
            key={config.key}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`p-3 bg-zinc-800 border border-zinc-700 rounded hover:border-zinc-600 transition-colors cursor-move ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 cursor-grab" title="Drag to reorder">⋮⋮</span>
                  <h4 className={`font-semibold ${config.color || 'text-zinc-100'}`}>{config.name}</h4>
                  <span className="text-xs text-zinc-500">({config.key})</span>
                </div>
                {config.description && (
                  <p className="text-xs text-zinc-400 mt-1">{config.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                  <span>
                    Notes: <span className="text-zinc-300">{config.availableNotes.join(' ')}</span>
                  </span>
                  <span>
                    Flam notes: <span className="text-zinc-300">
                      {config.flamNotes.length > 0 ? config.flamNotes.join(' ') : 'None'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onEditInstrument(config)}
                  className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
                  title="Edit instrument"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleExport(config)}
                  className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
                  title="Export to JSON"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(config)}
                  className={`px-2 py-1 text-xs rounded ${
                    deleteConfirm === config.key
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-red-400'
                  }`}
                  title={deleteConfirm === config.key ? 'Click again to confirm' : 'Delete instrument'}
                >
                  {deleteConfirm === config.key ? 'Confirm?' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {instruments.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            <p>No instruments configured.</p>
            <p className="text-xs mt-1">Click "Add Instrument" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
