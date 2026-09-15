import { LoaderCircle, Play, Pause } from 'lucide-react'
import type { Track } from '../../services/driveService'

interface LibraryViewProps {
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  onPlayTrack: (track: Track) => void
  loadingTrackId: string | null
  playbackError: string | null
}

export function LibraryView({ tracks, currentTrack, isPlaying, onPlayTrack, loadingTrackId, playbackError }: LibraryViewProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Library</h1>
      {playbackError && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{playbackError}</p>}
      <div className="divide-y divide-neutral-800">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onPlayTrack(track)}
            disabled={loadingTrackId !== null}
            className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-neutral-900/80 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-neutral-800 rounded-lg overflow-hidden flex items-center justify-center text-neutral-400 group-hover:text-red-500">
                {loadingTrackId === track.id ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-red-500" />
                ) : track.coverUrl ? (
                  <img src={track.coverUrl} alt="Cover" className="h-full w-full object-cover" />
                ) : currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="h-5 w-5 fill-current text-red-500" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </div>
              <div>
                <p className={`font-medium ${currentTrack?.id === track.id ? 'text-red-500' : 'text-neutral-200'}`}>
                  {track.title || track.name}
                </p>
                <p className="text-xs text-neutral-500">{track.artist || 'Google Drive Audio'}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}