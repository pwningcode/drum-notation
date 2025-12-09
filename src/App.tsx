import { useState, useEffect, useRef } from "react"
import { SongEditor } from "./components/SongEditor"
import { HelpDialog } from "./components/HelpDialog"
import { useAppSelector, useAppDispatch } from "./store/hooks"
import { setActiveSong, addSong, removeSong } from "./store/songsSlice"
import guineaFlag from "./assets/guinea-flag.svg"

export const App = () => {
  const dispatch = useAppDispatch()
  const { songs, activeSongId } = useAppSelector((state) => state.songs)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeSong = songs.find((song) => song.id === activeSongId)

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
    }
  }

  const handleAddSong = () => {
    const songNumber = songs.length + 1
    dispatch(addSong({ title: `New Song ${songNumber}` }))
    setIsDropdownOpen(false)
  }

  const handleSongSelect = (songId: string) => {
    if (!isEditing) {
      dispatch(setActiveSong(songId))
      setIsDropdownOpen(false)
    }
  }

  const handleExportSong = () => {
    if (activeSong) {
      const dataStr = JSON.stringify(activeSong, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${activeSong.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
    setIsDropdownOpen(false)
  }

  const handleImportSong = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const songData = JSON.parse(event.target?.result as string)
            dispatch(addSong(songData))
            setIsDropdownOpen(false)
          } catch (error) {
            console.error('Error importing song:', error)
            alert('Failed to import song. Please check the file format.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fixed Toolbar */}
      <div className="fixed top-0 left-0 right-0 bg-zinc-800 border-b border-zinc-700 shadow-lg z-50">
        <div className="container mx-auto px-2 sm:px-4">
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
                <div className="relative flex-1 sm:flex-initial min-w-0" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="px-2 sm:px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-md flex items-center gap-1 sm:gap-2 w-full sm:w-64 hover:bg-zinc-700"
                  >
                    <span className="text-zinc-100 font-medium truncate text-sm sm:text-base">
                      {activeSong ? activeSong.title : 'Select a song'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
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
                        {songs.map((song) => (
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
                  {!isEditing && (
                    <>
                      <button
                        onClick={handleImportSong}
                        className="p-2 bg-zinc-900 border border-zinc-600 rounded-md flex items-center hover:bg-zinc-700 text-zinc-300"
                        title="Import Song"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                      <button
                        onClick={handleExportSong}
                        className="p-2 bg-zinc-900 border border-zinc-600 rounded-md flex items-center hover:bg-zinc-700 text-zinc-300"
                        title="Export Song"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>

                      <div className="hidden sm:block h-8 w-px bg-zinc-600" />
                    </>
                  )}

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
                    className={`p-2 rounded-md flex items-center font-medium ${
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

      {/* Help Dialog */}
      <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Main Content with padding for fixed toolbar */}
      <div className="pt-14 sm:pt-16">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
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
