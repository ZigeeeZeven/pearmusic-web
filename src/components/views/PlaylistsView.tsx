import { useState } from 'react'
import { ListMusic, ArrowLeft, Music2 } from 'lucide-react'
import { parsePlaylistFile, type LocalFile, type Track } from '../../services/localMusicService'

interface PlaylistsViewProps {
  playlists: LocalFile[]
  tracks: Track[]
  onPlayTrack: (track: Track, queue: Track[]) => void
}

export function PlaylistsView({ playlists, tracks, onPlayTrack }: PlaylistsViewProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<LocalFile | null>(null)
  const [playlistTrackNames, setPlaylistTrackNames] = useState<string[]>([])
  const [loadingPlaylist, setLoadingPlaylist] = useState(false)
  const [playlistError, setPlaylistError] = useState<string | null>(null)

  const normalizeEntry = (value: string) => {
    let decoded = value.trim()
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      // Keep the original entry when it contains malformed URL encoding.
    }
    const withoutQuery = decoded.split(/[?#]/, 1)[0]
    const baseName = withoutQuery.split(/[\\/]/).pop() || withoutQuery
    return baseName.replace(/\.[^/.]+$/, '').replace(/\s+/g, ' ').trim().toLowerCase()
  }

  const findTrack = (entry: string) => {
    const normalizedEntry = normalizeEntry(entry)
    const exactMatch = tracks.find((track) => {
      const values = [track.name, track.title, `${track.artist} - ${track.title}`].map(normalizeEntry)
      return values.some((value) => value === normalizedEntry)
    })
    if (exactMatch) return exactMatch
    return tracks.find((track) => {
      const values = [track.name, track.title, `${track.artist} - ${track.title}`].map(normalizeEntry)
      return values.some((value) => value.length > 3 && (value.includes(normalizedEntry) || normalizedEntry.includes(value)))
    })
  }

  const handleOpenPlaylist = async (pl: LocalFile) => {
    setSelectedPlaylist(pl)
    setLoadingPlaylist(true)
    setPlaylistError(null)
    try {
      const names = await parsePlaylistFile(pl.url)
      setPlaylistTrackNames(names)
    } catch (err) {
      console.error(err)
      setPlaylistTrackNames([])
      setPlaylistError(err instanceof Error ? err.message : 'Unable to parse this playlist.')
    } finally {
      setLoadingPlaylist(false)
    }
  }

  if (selectedPlaylist) {
    const playlistEntries = playlistTrackNames.filter((entry, index, entries) =>
      entries.findIndex((candidate) => normalizeEntry(candidate) === normalizeEntry(entry)) === index
    )
    const matchedTracks = playlistEntries
      .map(findTrack)
      .filter((track): track is Track => Boolean(track))
      .filter((track, index, queue) => queue.findIndex((candidate) => candidate.id === track.id) === index)

    return (
      <div>
        <button
          onClick={() => setSelectedPlaylist(null)}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Playlists
        </button>
        <div className="flex items-end gap-6 mb-8">
          <div className="h-36 w-36 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center text-red-500">
            <ListMusic className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Playlist</p>
            <h1 className="text-4xl font-extrabold text-white mt-1">{selectedPlaylist.name}</h1>
            <p className="text-sm text-neutral-400 mt-2">{playlistEntries.length} tracks listed</p>
          </div>
        </div>

        {loadingPlaylist ? (
          <p className="text-neutral-500">Parsing playlist file...</p>
        ) : playlistError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{playlistError}</p>
        ) : (
          <div className="divide-y divide-neutral-800">
            {playlistEntries.map((name, index) => {
              const matchedTrack = findTrack(name)

              return (
                <div
                  key={index}
                  onClick={() => matchedTrack && onPlayTrack(matchedTrack, matchedTracks)}
                  className={`flex items-center justify-between py-3 px-3 rounded-lg ${
                    matchedTrack ? 'hover:bg-neutral-900 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4 text-left">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-800 text-red-500">
                      {matchedTrack?.coverUrl ? (
                        <img src={matchedTrack.coverUrl} alt={`${matchedTrack.title} cover`} className="h-full w-full object-cover" />
                      ) : (
                        <Music2 className="m-2 h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-left font-medium text-neutral-200">{matchedTrack ? matchedTrack.title : name}</p>
                      <p className="truncate text-left text-xs text-neutral-500">
                        {matchedTrack ? matchedTrack.artist : 'File missing from music folder'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Playlists</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => handleOpenPlaylist(pl)}
            className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl cursor-pointer hover:border-red-500/50 hover:bg-neutral-800/50 transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4 group-hover:scale-105 transition-transform">
              <ListMusic className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-neutral-100 truncate">{pl.name}</h3>
            <p className="text-xs text-neutral-500 mt-1">M3U / M3U8 playlist</p>
          </div>
        ))}
      </div>
    </div>
  )
}