import { ChevronLeft, ChevronRight, FileMusic, Music2, Pause, Play, Repeat, Repeat1 } from 'lucide-react'
import type { Track } from '../services/localMusicService'

export type RepeatMode = 'off' | 'all' | 'one'

interface PlayerBarProps {
  currentTrack: Track | null
  isPlaying: boolean
  onTogglePlayPause: () => void
  onPrevious: () => void
  onNext: () => void
  onOpen: () => void
  onOpenLyrics: () => void
  currentTime: number
  duration: number
  bufferedTime: number
  onSeek: (time: number) => void
  repeatMode: RepeatMode
  onToggleRepeat: () => void
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export function PlayerBar({
  currentTrack,
  isPlaying,
  onTogglePlayPause,
  onPrevious,
  onNext,
  onOpen,
  onOpenLyrics,
  currentTime,
  duration,
  bufferedTime,
  onSeek,
  repeatMode,
  onToggleRepeat,
}: PlayerBarProps) {
  const playedPercent = duration ? Math.min(100, (currentTime / duration) * 100) : 0
  const bufferedPercent = duration ? Math.min(100, (bufferedTime / duration) * 100) : 0

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-t border-neutral-800 bg-neutral-900/95 px-3 backdrop-blur-xl sm:h-20 sm:px-8">
      {/* Top Progress Bar Container */}
      <div className="absolute left-2 right-2 top-0 flex items-center gap-2 sm:left-8 sm:right-8">
        <span className="w-8 text-right text-[10px] text-neutral-500">{formatTime(currentTime)}</span>
        
        <div className="relative flex min-w-0 flex-1 items-center">
          {/* Layer 1: Base Track Background */}
          <div className="absolute left-0 right-0 h-1 overflow-hidden rounded-full bg-neutral-800">
            {/* Layer 2: Buffered Progress (Light Neutral/Gray) */}
            <div
              className="h-full bg-neutral-600/70 transition-[width] duration-300"
              style={{ width: `${bufferedPercent}%` }}
            />
          </div>

          {/* Layer 3: Active Playback Progress (White/Red Accent) */}
          <div
            className="pointer-events-none absolute left-0 h-1 rounded-full bg-red-500 z-0 transition-[width] duration-100"
            style={{ width: `${playedPercent}%` }}
          />

          {/* Layer 4: Transparent Interactive Slider */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => onSeek(Number(event.target.value))}
            disabled={!currentTrack || !duration}
            aria-label="Track progress"
            className="relative z-10 h-1 w-full min-w-0 appearance-none bg-transparent cursor-pointer [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <span className="w-8 text-[10px] text-neutral-500">{formatTime(duration)}</span>
      </div>

      {/* Left: Track Info */}
      <button
        onClick={onOpen}
        disabled={!currentTrack}
        className="flex min-w-0 max-w-[42%] items-center gap-2 text-left sm:w-1/3 sm:max-w-none sm:gap-3"
        aria-label="Open now playing"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-700/50 bg-neutral-800 text-red-500 sm:h-12 sm:w-12">
          {currentTrack?.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <Music2 className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 truncate">
          <p className="text-sm font-semibold text-neutral-100 truncate">
            {currentTrack ? currentTrack.title || currentTrack.name : 'Select a Track'}
          </p>
          <p className="text-xs text-neutral-400 truncate">
            {currentTrack ? currentTrack.artist || 'Pear Music Web' : 'Pear Music Web'}
          </p>
        </div>
      </button>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-1 sm:gap-5">
        <button
          onClick={onPrevious}
          disabled={!currentTrack}
          aria-label="Previous song"
          className="text-neutral-400 transition hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={onTogglePlayPause}
          disabled={!currentTrack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 sm:h-10 sm:w-10"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>
        <button
          onClick={onNext}
          disabled={!currentTrack}
          aria-label="Next song"
          className="text-neutral-400 transition hover:text-white disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex w-[42%] justify-end sm:w-1/3">
        <button
          onClick={onToggleRepeat}
          disabled={!currentTrack}
          aria-label={`Repeat ${repeatMode === 'all' ? 'playlist' : repeatMode}`}
          title={`Repeat ${repeatMode === 'all' ? 'playlist' : repeatMode}`}
          className={`mr-3 text-neutral-400 transition hover:text-white disabled:opacity-40 ${
            repeatMode !== 'off' ? 'text-red-400' : ''
          }`}
        >
          {repeatMode === 'one' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
        </button>
        <button
          onClick={onOpenLyrics}
          disabled={!currentTrack}
          aria-label="Open lyrics"
          title="Open lyrics"
          className="text-neutral-400 transition hover:text-white disabled:opacity-40"
        >
          <FileMusic className="h-5 w-5" />
        </button>
      </div>
    </footer>
  )
}