import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Song } from '../types';
import { resetToDefaults, reorderSongs } from '../store/songsSlice';
import kassaSong from '../assets/songs/kassa.json';
import sofaSong from '../assets/songs/sofa.json';
import sinteSong from '../assets/songs/sinte.json';
import yankadiSong from '../assets/songs/yankadi.json';
import soliSong from '../assets/songs/soli.json';
import kukuSong from '../assets/songs/kuku.json';
import tiribaSong from '../assets/songs/tiriba.json';

interface SongComparisonResult {
  title: string;
  userSong: Song | null;
  defaultSong: Song | null;
  status: 'up-to-date' | 'has-updates' | 'custom' | 'modified';
}

export const SongManagement: React.FC = () => {
  const dispatch = useDispatch();
  const userSongs = useSelector((state: RootState) => state.songs.songs);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const defaultSongs: Song[] = useMemo(() => {
    return [
      kassaSong,
      sofaSong,
      sinteSong,
      yankadiSong,
      soliSong,
      kukuSong,
      tiribaSong
    ] as Song[];
  }, []);

  // Sort songs by displayOrder
  const sortedUserSongs = useMemo(() => {
    return [...userSongs].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [userSongs]);

  // Compare songs and categorize them - preserve user's custom order
  const songComparison = useMemo((): SongComparisonResult[] => {
    // Build results based on user's song order
    return sortedUserSongs.map(userSong => {
      const defaultSong = defaultSongs.find(s => s.title === userSong.title);

      if (!defaultSong) {
        // Custom song (not in defaults)
        return {
          title: userSong.title,
          userSong,
          defaultSong: null,
          status: 'custom' as const
        };
      }

      // Compare modified dates and content
      const isModified = userSong.modified !== defaultSong.modified ||
                        !aresongsEqual(userSong, defaultSong);

      if (isModified) {
        return {
          title: defaultSong.title,
          userSong,
          defaultSong,
          status: 'modified' as const
        };
      } else {
        return {
          title: defaultSong.title,
          userSong,
          defaultSong,
          status: 'up-to-date' as const
        };
      }
    });
  }, [sortedUserSongs, defaultSongs]);

  const handleRestoreDefault = (song: SongComparisonResult) => {
    if (song.defaultSong) {
      const dataStr = JSON.stringify(song.defaultSong, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${song.defaultSong.title.toLowerCase().replace(/\s+/g, '-')}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleExportSong = (song: Song) => {
    const dataStr = JSON.stringify(song, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${song.title.toLowerCase().replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const upToDateCount = songComparison.filter(s => s.status === 'up-to-date').length;
  const modifiedCount = songComparison.filter(s => s.status === 'modified').length;
  const customCount = songComparison.filter(s => s.status === 'custom').length;

  const handleResetToDefaults = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all songs to their default configurations?\n\n' +
      'This will:\n' +
      '• Delete all custom songs\n' +
      '• Reset all modified songs to their original state\n' +
      '• Restore the original 7 default songs\n\n' +
      'This action cannot be undone!'
    );

    if (confirmed) {
      dispatch(resetToDefaults());
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

    const reordered = [...songComparison];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, removed);

    // Extract just the Song objects with updated order
    const reorderedSongs = reordered.map((item, index) => ({
      ...item.userSong!,
      displayOrder: index
    })).filter(s => s !== null);

    dispatch(reorderSongs(reorderedSongs));
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Reset to Defaults Button */}
      <div className="flex justify-end">
        <button
          onClick={handleResetToDefaults}
          className="px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700 rounded"
          title="Reset all songs to factory defaults"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Summary */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
        <h4 className="font-semibold text-zinc-200 mb-2">Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-zinc-400">Up to date</div>
            <div className="text-2xl font-bold text-green-400">{upToDateCount}</div>
          </div>
          <div>
            <div className="text-zinc-400">Modified</div>
            <div className="text-2xl font-bold text-yellow-400">{modifiedCount}</div>
          </div>
          <div>
            <div className="text-zinc-400">Custom</div>
            <div className="text-2xl font-bold text-blue-400">{customCount}</div>
          </div>
        </div>
      </div>

      {/* Song List */}
      <div className="space-y-2">
        {songComparison.map((song, index) => (
          <div
            key={song.title}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-zinc-800/30 border border-zinc-700 rounded p-4 hover:bg-zinc-800/50 transition-colors cursor-move ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-zinc-500 cursor-grab" title="Drag to reorder">⋮⋮</span>
                  <h5 className="font-semibold text-zinc-100">{song.title}</h5>
                  <StatusBadge status={song.status} />
                </div>
                <StatusDescription song={song} />
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {song.status === 'modified' && song.defaultSong && (
                  <button
                    onClick={() => handleRestoreDefault(song)}
                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded transition-colors"
                    title="Download the default version of this song"
                  >
                    Download Default
                  </button>
                )}

                {song.userSong && (
                  <button
                    onClick={() => handleExportSong(song.userSong!)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
                    title="Export your version as backup"
                  >
                    Export
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modifiedCount > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
          <p className="text-sm text-yellow-200">
            <strong>Note:</strong> Songs marked as "Modified" have been changed from their defaults.
            You can download the default version and then import it to restore the original, or export
            your version as a backup before making any changes.
          </p>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: SongComparisonResult['status'] }> = ({ status }) => {
  const styles = {
    'up-to-date': 'bg-green-900/30 text-green-300 border-green-700',
    'has-updates': 'bg-blue-900/30 text-blue-300 border-blue-700',
    'custom': 'bg-purple-900/30 text-purple-300 border-purple-700',
    'modified': 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  };

  const labels = {
    'up-to-date': 'Up to date',
    'has-updates': 'Update available',
    'custom': 'Custom song',
    'modified': 'Modified',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const StatusDescription: React.FC<{ song: SongComparisonResult }> = ({ song }) => {
  const descriptions = {
    'up-to-date': 'This song matches the bundled default version.',
    'has-updates': 'A new version of this song is available in the defaults.',
    'custom': 'This is your own song, not included in the defaults.',
    'modified': 'You have made changes to this default song.',
  };

  return (
    <p className="text-sm text-zinc-400">
      {descriptions[song.status]}
      {song.userSong && (
        <span className="ml-2">
          Last modified: {new Date(song.userSong.modified).toLocaleDateString()}
        </span>
      )}
    </p>
  );
};

// Deep comparison of songs (ignoring IDs and dates)
function aresongsEqual(song1: Song, song2: Song): boolean {
  // Compare everything except id, created, and modified dates
  if (song1.title !== song2.title) return false;
  if (song1.description !== song2.description) return false;
  if (song1.tempo !== song2.tempo) return false;
  if (song1.sections.length !== song2.sections.length) return false;

  // Deep compare sections
  for (let i = 0; i < song1.sections.length; i++) {
    const section1 = song1.sections[i];
    const section2 = song2.sections[i];

    if (section1.name !== section2.name) return false;
    if (section1.tempo !== section2.tempo) return false;
    if (section1.measures.length !== section2.measures.length) return false;

    // Deep compare measures
    for (let j = 0; j < section1.measures.length; j++) {
      const measure1 = section1.measures[j];
      const measure2 = section2.measures[j];

      if (JSON.stringify(measure1.timeSignature) !== JSON.stringify(measure2.timeSignature)) {
        return false;
      }
      if (measure1.tracks.length !== measure2.tracks.length) return false;

      // Deep compare tracks
      for (let k = 0; k < measure1.tracks.length; k++) {
        const track1 = measure1.tracks[k];
        const track2 = measure2.tracks[k];

        if (track1.instrument !== track2.instrument) return false;
        if (track1.label !== track2.label) return false;
        if (JSON.stringify(track1.notes) !== JSON.stringify(track2.notes)) return false;
      }
    }
  }

  return true;
}
