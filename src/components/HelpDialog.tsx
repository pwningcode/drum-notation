import React, { useState, useRef, useEffect } from 'react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Getting Started</h3>
        <p className="text-zinc-300">
          Welcome to Drum Notation! This application helps you create, edit, and organize drum notation
          for West African drum ensembles including Djembe, Sangban, Kenkeni, Dundunba, and Kenken.
        </p>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
          <h4 className="font-semibold text-zinc-200 mb-2">Quick Start:</h4>
          <ol className="list-decimal list-inside space-y-2 text-zinc-300">
            <li>Create a new song or select an existing one from the dropdown</li>
            <li>Click the "Edit" button to enter edit mode</li>
            <li>Add sections, measures, and instrument tracks to build your notation</li>
            <li>Click notes to cycle through different drum strokes</li>
            <li>Click "Done" when finished editing</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: 'songs',
    title: 'Managing Songs',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Managing Songs</h3>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Creating Songs</h4>
            <p className="text-zinc-300">
              Click the song dropdown menu and select "Add Song" to create a new song with default settings.
              Each new song starts with an intro section containing one measure.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Switching Songs</h4>
            <p className="text-zinc-300">
              Use the dropdown menu at the top to switch between songs. Note: You must exit edit mode
              before switching songs to prevent accidental changes.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Editing Song Details</h4>
            <p className="text-zinc-300">
              In edit mode, click on the song title to rename it, click the tempo to change BPM,
              and add a description to include notes about the song.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Deleting Songs</h4>
            <p className="text-zinc-300">
              In edit mode, use the "Delete" button in the toolbar to remove the current song. You'll be
              asked to confirm before deletion as this action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'import-export',
    title: 'Import/Export',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Import/Export Songs</h3>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Exporting Songs</h4>
            <p className="text-zinc-300 mb-2">
              Export your songs to save them as JSON files for backup or sharing:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300 ml-4">
              <li>Select the song you want to export from the dropdown</li>
              <li>Click the "Export" button in the toolbar</li>
              <li>The song will download as a .json file</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Importing Songs</h4>
            <p className="text-zinc-300 mb-2">
              Import previously exported songs or songs shared by others:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-300 ml-4">
              <li>Click the "Import" button in the toolbar</li>
              <li>Select a .json file from your computer</li>
              <li>The song will be added to your library and automatically selected</li>
            </ol>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
            <p className="text-sm text-blue-300">
              <strong>Tip:</strong> Regularly export your songs to keep backups. The app stores songs
              in your browser's local storage, which can be cleared if you clear browser data.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'sections',
    title: 'Sections & Structure',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Sections & Structure</h3>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Adding Sections</h4>
            <p className="text-zinc-300">
              Organize your song into sections like "Intro", "Break", "Solo", etc. In edit mode,
              click "+ Add Section Here" in the drop zones between sections to insert a new section
              at any position in your song.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Reordering Sections</h4>
            <p className="text-zinc-300">
              In edit mode, drag and drop sections to reorder them. Click and hold on a section header,
              then drag it to the desired position. Drop zones will appear to show where the section
              will be inserted.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Section Names & Tempo</h4>
            <p className="text-zinc-300">
              Click on a section name to rename it. You can also set a section-specific tempo that
              overrides the song's default tempo for that section only.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Removing Sections</h4>
            <p className="text-zinc-300">
              In edit mode, use the "Remove" button on a section to delete it. You must have at least
              one section in your song.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'measures',
    title: 'Working with Measures',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Working with Measures</h3>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Adding Measures</h4>
            <p className="text-zinc-300">
              In edit mode, click "Add Measure" within a section to add a new measure at the end.
              Each measure starts with a single djembe track.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Time Signatures</h4>
            <p className="text-zinc-300 mb-2">
              Click the time signature (e.g., "4/4") in a measure header to change:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-4">
              <li><strong>Beats:</strong> Number of beats per measure (2, 3, 4, etc.)</li>
              <li><strong>Division:</strong> Sixteenth notes (4 subdivisions) or Triplets (3 subdivisions)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Reordering Measures</h4>
            <p className="text-zinc-300">
              In edit mode, measures are displayed in a single column with horizontal drop zones between them.
              Drag any measure and drop it on a drop zone to reorder.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Duplicating & Removing</h4>
            <p className="text-zinc-300">
              Use the "Duplicate" button to create a copy of a measure. Use "Remove" to delete a measure
              (sections must have at least one measure).
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'tracks',
    title: 'Instrument Tracks',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Instrument Tracks</h3>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Adding Tracks</h4>
            <p className="text-zinc-300 mb-2">
              In edit mode, click the "+" button in a measure to add instrument tracks:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-4">
              <li><strong>Djembe:</strong> Bass (B), Tone (T), Slap (S), Accent (^)</li>
              <li><strong>Sangban:</strong> Open (O), Muted (M)</li>
              <li><strong>Kenkeni:</strong> Open (O), Muted (M)</li>
              <li><strong>Dundunba:</strong> Open (O), Muted (M)</li>
              <li><strong>Kenken:</strong> Open (O), Muted (M)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Track Labels</h4>
            <p className="text-zinc-300">
              Optionally add labels to tracks like "Solo 1" or "Part A" to distinguish different parts
              played on the same instrument.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Removing Tracks</h4>
            <p className="text-zinc-300">
              Click the "×" button next to a track label to remove it. Measures must have at least one track.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'notation',
    title: 'Editing Notation',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Editing Notation</h3>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Clicking Notes</h4>
            <p className="text-zinc-300">
              In edit mode, click any note to cycle through available strokes for that instrument.
              Each click advances to the next stroke in the cycle, returning to rest (.) at the end.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Djembe Notation</h4>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded p-3 text-sm">
              <ul className="space-y-1 text-zinc-300">
                <li><strong>. (dot)</strong> - Rest / no stroke</li>
                <li><strong>B</strong> - Bass (low tone, center of drum)</li>
                <li><strong>T</strong> - Tone (open tone, edge of drum)</li>
                <li><strong>S</strong> - Slap (sharp, high-pitched stroke)</li>
                <li><strong>^</strong> - Accent (muted slap)</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">DunDun Notation</h4>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded p-3 text-sm">
              <ul className="space-y-1 text-zinc-300">
                <li><strong>. (dot)</strong> - Rest / no stroke</li>
                <li><strong>O</strong> - Open (let drum ring)</li>
                <li><strong>M</strong> - Muted (dampen with drum stick)</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-2">Reading the Grid</h4>
            <p className="text-zinc-300">
              Each measure shows a grid where columns represent subdivisions (16th notes or triplets)
              and rows represent different instrument tracks. The beat numbers are shown above the grid.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'tips',
    title: 'Tips & Shortcuts',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-zinc-100">Tips & Shortcuts</h3>

        <div className="space-y-3">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
            <h4 className="font-semibold text-zinc-200 mb-3">Keyboard Shortcuts</h4>
            <ul className="space-y-2 text-zinc-300 text-sm">
              <li><strong>Escape</strong> - Cancel editing (title, tempo, description, etc.)</li>
              <li><strong>Enter</strong> - Save changes when editing text fields</li>
            </ul>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
            <h4 className="font-semibold text-zinc-200 mb-3">Best Practices</h4>
            <ul className="space-y-2 text-zinc-300 text-sm">
              <li>Use descriptive section names like "Intro", "Break 1", "Solo Section"</li>
              <li>Set section-specific tempos for breaks or tempo changes</li>
              <li>Add song descriptions to note the rhythm name, origin, or performance notes</li>
              <li>Duplicate measures to quickly create variations</li>
              <li>Export songs regularly to keep backups</li>
              <li>Use track labels when you have multiple parts for the same instrument</li>
            </ul>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
            <p className="text-sm text-blue-300">
              <strong>Pro Tip:</strong> In view mode (when not editing), the layout optimizes for reading
              with measures flowing horizontally. Switch to edit mode to see the single-column layout
              optimized for editing and reordering.
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset to first section when dialog opens
      setActiveSection('getting-started');
    }
  }, [isOpen]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = sectionRefs.current[sectionId];
    if (element && contentRef.current) {
      const container = contentRef.current;
      const elementTop = element.offsetTop - container.offsetTop;
      container.scrollTo({
        top: elementTop - 20,
        behavior: 'smooth',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 sm:p-4">
      <div className="relative w-full h-full max-w-6xl max-h-screen bg-zinc-900 sm:rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-700">
          <h2 className="text-lg sm:text-2xl font-bold text-zinc-100">How to Use Drum Notation</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl w-8 h-8 flex items-center justify-center"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation - Hidden on mobile */}
          <nav className="hidden sm:block w-64 border-r border-zinc-700 overflow-y-auto">
            <ul className="py-4">
              {helpSections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-6 py-3 transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-900/30 text-blue-400 border-r-2 border-blue-500'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
            <div className="max-w-3xl space-y-12">
              {helpSections.map((section) => (
                <div
                  key={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  className="scroll-mt-6"
                >
                  {section.content}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
