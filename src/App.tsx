import { useState, useEffect, useRef, useMemo } from "react"
import { SongEditor } from "./components/SongEditor"
import { HelpDialog } from "./components/HelpDialog"
import { MigrationDialog } from "./components/MigrationDialog"
import { useAppSelector, useAppDispatch } from "./store/hooks"
import { setActiveSong, addSong, removeSong, applyFocusFilterToSongs } from "./store/songsSlice"
import { setInstrumentFocus, toggleWesternNotation } from "./store/preferencesSlice"
import guineaFlag from "./assets/guinea-flag.svg"

export const App = () => {
  const dispatch = useAppDispatch()
  const { songs, activeSongId } = useAppSelector((state) => state.songs)
  const instruments = useAppSelector((state) => state.instruments.instruments)
  const focusedInstruments = useAppSelector((state) => state.preferences.instrumentFocus)
  const westernNotation = useAppSelector((state) => state.preferences.westernNotation)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)
  const [welcomeStep, setWelcomeStep] = useState<1 | 2>(1)
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeSong = songs.find((song) => song.id === activeSongId)

  // Sort songs by displayOrder for the dropdown
  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  }, [songs])

  // Check if this is the user's first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setShowWelcomeDialog(true)
      // Initialize with all instruments selected by default
      setSelectedInstruments(instruments.map(i => i.key))
    }
  }, [instruments])

  const handleToggleInstrument = (instrumentKey: string) => {
    setSelectedInstruments(prev => {
      if (prev.includes(instrumentKey)) {
        // Don't allow removing last instrument
        if (prev.length === 1) return prev
        return prev.filter(k => k !== instrumentKey)
      } else {
        return [...prev, instrumentKey]
      }
    })
  }

  const handleContinueFromStep1 = () => {
    setWelcomeStep(2)
  }

  const handleBackToStep1 = () => {
    setWelcomeStep(1)
  }

  const handleCompleteWelcome = () => {
    // 1. Save preferences
    dispatch(setInstrumentFocus(selectedInstruments))

    // 2. Apply filter to default songs (hide unfocused tracks)
    dispatch(applyFocusFilterToSongs({
      focusedInstruments: selectedInstruments,
      onlyDefaultSongs: true
    }))

    // 3. Mark welcome as complete
    localStorage.setItem('hasSeenWelcome', 'true')
    setShowWelcomeDialog(false)
    setWelcomeStep(1)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev)
  }

  const handleDeleteSong = () => {
    if (activeSong && confirm(`Delete "${activeSong.title}"? This cannot be undone.`)) {
      dispatch(removeSong(activeSong.id))
      setIsEditing(false)
    }
  }

  const handleAddSong = () => {
    const songNumber = songs.length + 1
    dispatch(addSong({ title: `New Song ${songNumber}`, focusedInstruments }))
    setIsDropdownOpen(false)
  }

  const handleSongSelect = (songId: string) => {
    if (!isEditing) {
      dispatch(setActiveSong(songId))
      setIsDropdownOpen(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fixed Toolbar */}
      <div className="fixed top-0 left-0 right-0 bg-zinc-800 border-b border-zinc-700 shadow-lg z-50">
        <div className="px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Logo and Song Selector */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Logo */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <img
                  src={guineaFlag}
                  alt="Guinea Flag"
                  className="w-6 h-5 sm:w-8 sm:h-6 rounded border border-zinc-600"
                />
                <h1 className="hidden sm:block text-base sm:text-xl font-bold text-zinc-100">ACAI</h1>
              </div>

              {/* Song Selector */}
              {!isEditing && (
                <div className="relative flex-1 sm:flex-initial min-w-0 mr-1" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-2 sm:px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-md flex items-center justify-between w-full sm:w-64 hover:bg-zinc-700"
                  >
                    <span className="text-zinc-100 font-medium truncate text-sm sm:text-base">
                      {activeSong ? activeSong.title : 'Select a song'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-400 transition-transform flex-shrink-0 ml-1 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl overflow-hidden">
                      <div>
                        {sortedSongs.map((song) => (
                          <button
                            key={song.id}
                            onClick={() => handleSongSelect(song.id)}
                            className={`w-full px-4 py-2 text-left hover:bg-zinc-700 ${
                              activeSongId === song.id ? 'bg-blue-900/30 text-blue-400' : 'text-zinc-300'
                            }`}
                          >
                            {song.title}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-zinc-700" />
                      <div className="p-1">
                        <button
                          onClick={handleAddSong}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:bg-zinc-700 rounded flex items-center gap-2"
                        >
                          <span className="text-lg">+</span>
                          <span>Add Song</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Center: Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-3">
              {activeSong && (
                <>
                  {isEditing && (
                    <>
                      <button
                        onClick={handleDeleteSong}
                        className="p-2 bg-zinc-900 border border-zinc-600 rounded-md flex items-center hover:bg-red-900 hover:border-red-700 text-red-400 hover:text-red-300"
                        title="Delete Song"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      <div className="hidden sm:block h-8 w-px bg-zinc-600" />
                    </>
                  )}

                  <button
                    onClick={toggleEditMode}
                    className={`p-2 rounded-md flex items-center font-medium mr-1 ${
                      isEditing
                        ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
                        : 'bg-zinc-900 border border-zinc-600 hover:bg-zinc-700 text-zinc-300'
                    }`}
                    title={isEditing ? 'Done Editing' : 'Edit Song'}
                  >
                    {isEditing ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                  </button>

                  {/* Western Notation Toggle */}
                  <button
                    onClick={() => dispatch(toggleWesternNotation())}
                    className={`p-2 rounded-md flex items-center font-medium mr-1 ${
                      westernNotation.enabled
                        ? 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-500'
                        : 'bg-zinc-900 border border-zinc-600 hover:bg-zinc-700 text-zinc-300'
                    }`}
                    title={westernNotation.enabled ? 'Hide Western Notation (Cycles Only)' : 'Show Western Notation (Beats & Labels)'}
                  >
                    <span className="text-sm font-bold">
                      {westernNotation.enabled ? 'ABC' : '123'}
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Right: Help Button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 bg-zinc-900 border border-zinc-600 rounded-md flex items-center hover:bg-zinc-700 text-zinc-300 flex-shrink-0"
              title="Help & Instructions"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Welcome Dialog */}
      {showWelcomeDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <div className="max-w-2xl w-full bg-zinc-900 border border-zinc-700 rounded-lg p-6 sm:p-8 space-y-6">
            {/* Step 1: Data Persistence Warning */}
            {welcomeStep === 1 && (
              <>
                <div className="space-y-4 text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                    Welcome to Drum Notation!
                  </h2>
                  <div className="space-y-3 text-base sm:text-lg text-zinc-300">
                    <p>
                      Your song edits are stored in your browser's local storage.
                    </p>
                    <p className="text-yellow-400 font-medium">
                      ⚠️ This data can be lost if you clear your browser data or use a different device.
                    </p>
                    <p>
                      Please use the <span className="font-semibold text-blue-400">Song Management</span> section in Settings to export and import your songs as backup files.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={handleContinueFromStep1}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-lg transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Instrument Selection */}
            {welcomeStep === 2 && (
              <>
                <div className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 text-center">
                    Choose Your Instruments
                  </h2>
                  <p className="text-base text-zinc-300 text-center">
                    Select which instruments you want to see and use in your notation. You can change this later in Settings.
                  </p>
                </div>

                <div className="space-y-3">
                  {instruments
                    .slice()
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((config) => (
                      <label
                        key={config.key}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedInstruments.includes(config.key)
                            ? 'bg-blue-900/30 border-blue-600'
                            : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedInstruments.includes(config.key)}
                          onChange={() => handleToggleInstrument(config.key)}
                          disabled={selectedInstruments.length === 1 && selectedInstruments.includes(config.key)}
                          className="w-5 h-5 rounded"
                        />
                        <span className={`text-lg font-medium ${config.color || 'text-zinc-100'}`}>
                          {config.name}
                        </span>
                        {config.description && (
                          <span className="text-sm text-zinc-400 ml-auto">{config.description}</span>
                        )}
                      </label>
                    ))}
                </div>

                {selectedInstruments.length === 1 && (
                  <p className="text-sm text-yellow-400 text-center">
                    At least one instrument must be selected.
                  </p>
                )}

                <div className="flex justify-between gap-4">
                  <button
                    onClick={handleBackToStep1}
                    className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCompleteWelcome}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-lg transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Help Dialog */}
      <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Migration Dialog */}
      <MigrationDialog />

      {/* Main Content with padding for fixed toolbar */}
      <div className="pt-14 sm:pt-16">
        <div className="px-2 sm:px-4 py-4 sm:py-8">
          {activeSong ? (
            <SongEditor song={activeSong} isEditing={isEditing} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No song selected</p>
              <button
                onClick={handleAddSong}
                className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
              >
                Create Your First Song
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
