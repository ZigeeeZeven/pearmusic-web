import { Disc3 } from 'lucide-react'
import type { Track } from '../../services/driveService'

interface AlbumsViewProps {
  tracks: Track[]
}

export function AlbumsView({ tracks }: AlbumsViewProps) {
  // Group tracks by album name
  const albumMap = tracks.reduce((acc, track) => {
    const album = track.album || 'Unknown Album'
    if (!acc[album]) acc[album] = []
    acc[album].push(track)
    return acc
  }, {} as Record<string, Track[]>)

  const albums = Object.keys(albumMap)

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Albums</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {albums.map((album) => {
          const albumTracks = albumMap[album]
          const coverUrl = albumTracks[0]?.coverUrl
          const artist = albumTracks[0]?.artist || 'Various Artists'

          return (
            <div
              key={album}
              className="p-4 bg-neutral-900/50 border border-neutral-800/80 rounded-2xl group hover:bg-neutral-800/50 transition-all cursor-pointer flex flex-col"
            >
              <div className="aspect-square w-full rounded-xl bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-red-500 mb-3 overflow-hidden shadow-md group-hover:scale-[1.02] transition-transform">
                {coverUrl ? (
                  <img src={coverUrl} alt={album} className="h-full w-full object-cover" />
                ) : (
                  <Disc3 className="h-12 w-12 text-neutral-500" />
                )}
              </div>
              <h3 className="font-semibold text-neutral-100 truncate w-full">{album}</h3>
              <p className="text-xs text-neutral-500 truncate mt-0.5">{artist}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}