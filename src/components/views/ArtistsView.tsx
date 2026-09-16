import { ArrowLeft, Music2, User } from 'lucide-react'
import type { Track } from '../../services/localMusicService'

interface ArtistsViewProps {
  tracks: Track[]
  onPlayTrack: (track: Track, queue: Track[]) => void
  selectedArtist: string | null
  onSelectedArtistChange: (artist: string | null) => void
}

export function ArtistsView({ tracks, onPlayTrack, selectedArtist, onSelectedArtistChange }: ArtistsViewProps) {
  // Group tracks by artist name
  const artistMap = tracks.reduce((acc, track) => {
    const artist = track.artist || 'Unknown Artist'
    if (!acc[artist]) acc[artist] = []
    acc[artist].push(track)
    return acc
  }, {} as Record<string, Track[]>)

  const artists = Object.keys(artistMap)

  if (selectedArtist) {
    const artistTracks = artistMap[selectedArtist]

    return (
      <div>
        <button onClick={() => onSelectedArtistChange(null)} className="mb-6 flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Artists
        </button>
        <div className="mb-8 flex items-end gap-6">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 text-red-500">
            {artistTracks[0]?.coverUrl ? <img src={artistTracks[0].coverUrl} alt={selectedArtist} className="h-full w-full object-cover" /> : <User className="h-16 w-16" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Artist</p>
            <h1 className="mt-1 text-4xl font-extrabold text-white">{selectedArtist}</h1>
            <p className="mt-2 text-sm text-neutral-400">{artistTracks.length} tracks</p>
          </div>
        </div>
        <div className="divide-y divide-neutral-800">
          {artistTracks.map((track) => (
            <button key={track.id} onClick={() => onPlayTrack(track, artistTracks)} className="flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-neutral-900/80">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-800 text-red-500">
                {track.coverUrl ? <img src={track.coverUrl} alt="Cover" className="h-full w-full object-cover" /> : <Music2 className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-200">{track.title || track.name}</p>
                <p className="truncate text-xs text-neutral-500">{track.album}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Artists</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {artists.map((artist) => (
          <button
            key={artist}
            onClick={() => onSelectedArtistChange(artist)}
            aria-label={`Open ${artist}`}
            className="flex flex-col items-center p-4 bg-neutral-900/50 border border-neutral-800/80 rounded-2xl text-center group hover:bg-neutral-800/50 transition-all cursor-pointer"
          >
            <div className="h-32 w-32 rounded-full bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-red-500 mb-4 overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
              {artistMap[artist][0]?.coverUrl ? (
                <img src={artistMap[artist][0].coverUrl} alt={artist} className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-neutral-500" />
              )}
            </div>
            <h3 className="font-semibold text-neutral-100 truncate w-full">{artist}</h3>
            <p className="text-xs text-neutral-500 mt-1">{artistMap[artist].length} Tracks</p>
          </button>
        ))}
      </div>
    </div>
  )
}