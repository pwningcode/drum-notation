/**
 * Migration Dialog Component
 * Shows users when schema migrations are available and lets them choose how to handle them
 */

import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import {
  setDialogOpen,
  dismissSongVersion,
  dismissInstrumentVersion,
  recordSongMigration,
  recordInstrumentMigration
} from '../store/migrationSlice';
import {
  mergeSongsWithDefaults,
  mergeInstrumentsWithDefaults,
  MergeOptions,
  DEFAULT_MERGE_OPTIONS
} from '../migration/mergeStrategy';
import { loadDefaultSongs } from '../store/persistence';
import { DEFAULT_INSTRUMENTS } from '../assets/defaultInstruments';
import { setSongs } from '../store/songsSlice';
import { replaceInstruments } from '../store/instrumentsSlice';

type TabType = 'songs' | 'instruments';

export const MigrationDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const dialogOpen = useAppSelector(state => state.migration.dialogOpen);
  const songsMigration = useAppSelector(state => state.migration.songs.pendingMigration);
  const instrumentsMigration = useAppSelector(state => state.migration.instruments.pendingMigration);
  const userSongs = useAppSelector(state => state.songs.songs);
  const userInstruments = useAppSelector(state => state.instruments.instruments);

  const [activeTab, setActiveTab] = useState<TabType>('songs');
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>(DEFAULT_MERGE_OPTIONS);

  // Load defaults for comparison
  const defaultSongs = useMemo(() => loadDefaultSongs(), []);
  const defaultInstruments = useMemo(() => DEFAULT_INSTRUMENTS, []);

  // Preview merge results
  const songsMergePreview = useMemo(() => {
    if (!songsMigration?.needed) return null;
    return mergeSongsWithDefaults(userSongs, defaultSongs, mergeOptions);
  }, [userSongs, defaultSongs, mergeOptions, songsMigration]);

  const instrumentsMergePreview = useMemo(() => {
    if (!instrumentsMigration?.needed) return null;
    return mergeInstrumentsWithDefaults(userInstruments, defaultInstruments, mergeOptions);
  }, [userInstruments, defaultInstruments, mergeOptions, instrumentsMigration]);

  if (!dialogOpen || (!songsMigration?.needed && !instrumentsMigration?.needed)) {
    return null;
  }

  const handleClose = () => {
    dispatch(setDialogOpen(false));
  };

  const handleDismiss = () => {
    if (activeTab === 'songs' && songsMigration) {
      dispatch(dismissSongVersion(songsMigration.toVersion));
    } else if (activeTab === 'instruments' && instrumentsMigration) {
      dispatch(dismissInstrumentVersion(instrumentsMigration.toVersion));
    }
    handleClose();
  };

  const handleKeepMyData = () => {
    const timestamp = new Date().toISOString();

    if (activeTab === 'songs' && songsMigration) {
      dispatch(recordSongMigration({
        fromVersion: songsMigration.fromVersion,
        toVersion: songsMigration.toVersion,
        timestamp,
        userChoice: 'kept-data'
      }));
    } else if (activeTab === 'instruments' && instrumentsMigration) {
      dispatch(recordInstrumentMigration({
        fromVersion: instrumentsMigration.fromVersion,
        toVersion: instrumentsMigration.toVersion,
        timestamp,
        userChoice: 'kept-data'
      }));
    }
    handleClose();
  };

  const handleAcceptUpdates = () => {
    const timestamp = new Date().toISOString();

    if (activeTab === 'songs' && songsMigration && songsMergePreview) {
      // Apply merge
      dispatch(setSongs(songsMergePreview.merged));
      dispatch(recordSongMigration({
        fromVersion: songsMigration.fromVersion,
        toVersion: songsMigration.toVersion,
        timestamp,
        userChoice: 'accepted'
      }));
    } else if (activeTab === 'instruments' && instrumentsMigration && instrumentsMergePreview) {
      // Apply merge
      dispatch(replaceInstruments(instrumentsMergePreview.merged));
      dispatch(recordInstrumentMigration({
        fromVersion: instrumentsMigration.fromVersion,
        toVersion: instrumentsMigration.toVersion,
        timestamp,
        userChoice: 'accepted'
      }));
    }
    handleClose();
  };

  const handleExport = () => {
    const dataToExport = activeTab === 'songs' ? userSongs : userInstruments;
    const fileName = activeTab === 'songs' ? 'songs-backup.json' : 'instruments-backup.json';

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  };

  const currentMigration = activeTab === 'songs' ? songsMigration : instrumentsMigration;
  const currentPreview = activeTab === 'songs' ? songsMergePreview : instrumentsMergePreview;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Migration Available</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Version {currentMigration?.fromVersion} → {currentMigration?.toVersion}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-100 text-2xl leading-none"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {songsMigration?.needed && (
              <button
                onClick={() => setActiveTab('songs')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'songs'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Songs
              </button>
            )}
            {instrumentsMigration?.needed && (
              <button
                onClick={() => setActiveTab('instruments')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'instruments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Instruments
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Migration Description */}
          <div className="bg-blue-900/20 border border-blue-700 rounded p-4">
            <h3 className="font-semibold text-blue-200 mb-2">What's changing?</h3>
            <ul className="text-sm text-blue-100 space-y-1">
              {currentMigration?.descriptions.map((desc, i) => (
                <li key={i}>• {desc}</li>
              ))}
            </ul>
          </div>

          {/* Preview Summary */}
          {currentPreview && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
              <h3 className="font-semibold text-zinc-200 mb-3">Preview Changes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-zinc-400">New</div>
                  <div className="text-2xl font-bold text-blue-400">{currentPreview.added.length}</div>
                </div>
                <div>
                  <div className="text-zinc-400">To Update</div>
                  <div className="text-2xl font-bold text-yellow-400">{currentPreview.updated.length}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Preserved</div>
                  <div className="text-2xl font-bold text-green-400">{currentPreview.preserved.length}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Conflicts</div>
                  <div className="text-2xl font-bold text-orange-400">{currentPreview.conflicts.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* Merge Options */}
          <div className="bg-zinc-800/30 border border-zinc-700 rounded p-4">
            <h3 className="font-semibold text-zinc-200 mb-3">Merge Options</h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 text-zinc-300">
                <input
                  type="checkbox"
                  checked={mergeOptions.preserveUserData}
                  onChange={(e) => setMergeOptions({ ...mergeOptions, preserveUserData: e.target.checked })}
                  className="rounded"
                />
                <span>Preserve my custom {activeTab}</span>
              </label>
              <label className="flex items-center gap-2 text-zinc-300">
                <input
                  type="checkbox"
                  checked={mergeOptions.addNewDefaults}
                  onChange={(e) => setMergeOptions({ ...mergeOptions, addNewDefaults: e.target.checked })}
                  className="rounded"
                />
                <span>Add new bundled {activeTab}</span>
              </label>
              <label className="flex items-center gap-2 text-zinc-300">
                <input
                  type="checkbox"
                  checked={mergeOptions.updateModified}
                  onChange={(e) => setMergeOptions({ ...mergeOptions, updateModified: e.target.checked })}
                  className="rounded"
                />
                <span>Overwrite my modifications to defaults</span>
              </label>
            </div>
          </div>

          {/* Conflicts Warning */}
          {currentPreview && currentPreview.conflicts.length > 0 && (
            <div className="bg-orange-900/20 border border-orange-700 rounded p-4">
              <p className="text-sm text-orange-200">
                <strong>Note:</strong> You have {currentPreview.conflicts.length} {activeTab} that differ from the defaults.
                {mergeOptions.updateModified
                  ? ' They will be overwritten with the default versions.'
                  : ' Your versions will be preserved.'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-700 p-4 flex gap-2 justify-end">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded text-sm font-medium"
          >
            Dismiss
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded text-sm font-medium"
          >
            Export Backup
          </button>
          <button
            onClick={handleKeepMyData}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium"
          >
            Keep My Data
          </button>
          <button
            onClick={handleAcceptUpdates}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium"
          >
            Accept Updates
          </button>
        </div>
      </div>
    </div>
  );
};
