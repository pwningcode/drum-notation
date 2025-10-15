import { Song } from "./Song"
import { useAppSelector, useAppDispatch } from "./store/hooks"
import { setActiveSong } from "./store/songsSlice"

export const App = () => {
  const dispatch = useAppDispatch()
  const { songs, activeSongTitle } = useAppSelector((state: any) => state.songs)
  
  const activeSong = songs.find((song: any) => song.title === activeSongTitle)

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {songs.map((song: any) => (
                <button
                  key={song.title}
                  onClick={() => dispatch(setActiveSong(song.title))}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeSongTitle === song.title
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                  }`}
                >
                  {song.title}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Active Song Content */}
        {activeSong && (
          <Song
            title={activeSong.title}
            timeSig={activeSong.timeSig}
            intro={activeSong.intro}
            variants={activeSong.variants}
            outro={activeSong.outro}
          />
        )}
      </div>
    </div>
  )
}
