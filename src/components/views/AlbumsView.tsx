import { ArrowLeft, Disc3, Music2 } from 'lucide-react'
import type { Track } from '../../services/localMusicService'

interface AlbumsViewProps {
  tracks: Track[]
  onPlayTrack: (track: Track, queue: Track[]) => void
  selectedAlbum: string | null
  onSelectedAlbumChange: (album: string | null) => void
}

export function AlbumsView({ tracks, onPlayTrack, selectedAlbum, onSelectedAlbumChange }: AlbumsViewProps) {
  // Group tracks by album name
  const albumMap = tracks.reduce((acc, track) => {
    const album = track.album || 'Unknown Album'
    if (!acc[album]) acc[album] = []
    acc[album].push(track)
    return acc
  }, {} as Record<string, Track[]>)

  const albums = Object.keys(albumMap)

  if (selectedAlbum) {
    const albumTracks = albumMap[selectedAlbum]
    const coverUrl = albumTracks[0]?.coverUrl
    const artist = albumTracks[0]?.artist || 'Various Artists'

    return (
      <div>
        <button onClick={() => onSelectedAlbumChange(null)} className="mb-6 flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Albums
        </button>
        <div className="mb-8 flex items-end gap-6">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 text-red-500">
            {coverUrl ? <img src={coverUrl} alt={selectedAlbum} className="h-full w-full object-cover" /> : <Disc3 className="h-16 w-16" />}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Album</p>
            <h1 className="mt-1 text-4xl font-extrabold text-white">{selectedAlbum}</h1>
            <p className="mt-2 text-sm text-neutral-400">{artist} · {albumTracks.length} tracks</p>
          </div>
        </div>
        <div className="divide-y divide-neutral-800">
          {albumTracks.map((track) => (
            <button key={track.id} onClick={() => onPlayTrack(track, albumTracks)} className="flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-neutral-900/80">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-800 text-red-500">
                {track.coverUrl ? <img src={track.coverUrl} alt="Cover" className="h-full w-full object-cover" /> : <Music2 className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-200">{track.title || track.name}</p>
                <p className="truncate text-xs text-neutral-500">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Albums</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {albums.map((album) => {
          const albumTracks = albumMap[album]
          const coverUrl = albumTracks[0]?.coverUrl
          const artist = albumTracks[0]?.artist || 'Various Artists'

          return (
            <button
              key={album}
              onClick={() => onSelectedAlbumChange(album)}
              aria-label={`Open album ${album}`}
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
            </button>
          )
        })}
      </div>
    </div>
  )
}