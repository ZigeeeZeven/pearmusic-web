import { User } from 'lucide-react'
import type { Track } from '../../services/driveService'

interface ArtistsViewProps {
  tracks: Track[]
}

export function ArtistsView({ tracks }: ArtistsViewProps) {
  // Group tracks by artist name
  const artistMap = tracks.reduce((acc, track) => {
    const artist = track.artist || 'Unknown Artist'
    if (!acc[artist]) acc[artist] = []
    acc[artist].push(track)
    return acc
  }, {} as Record<string, Track[]>)

  const artists = Object.keys(artistMap)

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Artists</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {artists.map((artist) => (
          <div
            key={artist}
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
          </div>
        ))}
      </div>
    </div>
  )
}