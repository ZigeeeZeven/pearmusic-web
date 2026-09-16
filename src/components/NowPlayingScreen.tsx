import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ChevronLeft, ChevronRight, LoaderCircle, Music2, Pause, Play, Repeat, Repeat1, Search, X } from 'lucide-react'
import type { Track } from '../services/localMusicService'
import type { LrclibResult, LyricLine } from '../services/lyricsService'
import type { RepeatMode } from './PlayerBar'

interface NowPlayingScreenProps {
  currentTrack: Track | null
  isPlaying: boolean
  lyrics: string | null
  lyricLines: LyricLine[]
  currentTime: number
  duration: number
  bufferedTime: number
  lyricsDelay: number
  lyricsLoading: boolean
  onSeek: (time: number) => void
  onChangeLyricsDelay: (delay: number) => void
  onSearchLyrics: (title: string, artist: string) => Promise<LrclibResult[]>
  onSelectLyrics: (result: LrclibResult) => void
  onClose: () => void
  onTogglePlayPause: () => void
  onPrevious: () => void
  onNext: () => void
  repeatMode: RepeatMode
  onToggleRepeat: () => void
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function formatSampleRate(sampleRate: number): string {
  return `${(sampleRate / 1000).toFixed(sampleRate % 1000 === 0 ? 0 : 1)} kHz`
}

function isMp3Track(track: Track): boolean {
  return /\.mp3$/i.test(track.name)
}

export function NowPlayingScreen({ currentTrack, isPlaying, lyrics, lyricLines, currentTime, duration, bufferedTime, lyricsDelay, lyricsLoading, onSeek, onChangeLyricsDelay, onSearchLyrics, onSelectLyrics, onClose, onTogglePlayPause, onPrevious, onNext, repeatMode, onToggleRepeat }: NowPlayingScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [titleQuery, setTitleQuery] = useState('')
  const [artistQuery, setArtistQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<LrclibResult[]>([])
  const [lyricsToolbarPinned, setLyricsToolbarPinned] = useState(false)
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([])
  const lyricsScrollRef = useRef<HTMLDivElement | null>(null)
  const screenRef = useRef<HTMLDivElement | null>(null)
  const lyricsPanelRef = useRef<HTMLElement | null>(null)
  const lyricsToolbarRef = useRef<HTMLDivElement | null>(null)
  const activeIndex = lyricLines.reduce((active, line, index) => (line.time + lyricsDelay <= currentTime ? index : active), -1)
  const playedPercent = duration ? Math.min(100, (currentTime / duration) * 100) : 0
  const bufferedPercent = duration ? Math.min(100, (bufferedTime / duration) * 100) : 0

  useEffect(() => {
    if (activeIndex < 0) return
    const lyricsScroll = lyricsScrollRef.current
    const activeLine = lineRefs.current[activeIndex]
    if (!lyricsScroll || !activeLine) return
    const containerRect = lyricsScroll.getBoundingClientRect()
    const lineRect = activeLine.getBoundingClientRect()
    const lineOffset = lineRect.top - containerRect.top + lyricsScroll.scrollTop
    const targetScrollTop = lineOffset - (lyricsScroll.clientHeight - lineRect.height) / 2
    const maximumScrollTop = lyricsScroll.scrollHeight - lyricsScroll.clientHeight
    lyricsScroll.scrollTo({ top: Math.max(0, Math.min(maximumScrollTop, targetScrollTop)), behavior: 'smooth' })
  }, [activeIndex])

  useEffect(() => {
    const screen = screenRef.current
    const panel = lyricsPanelRef.current
    if (!screen || !panel) return

    const updateToolbarPosition = () => {
      if (!window.matchMedia('(max-width: 1023px)').matches) {
        setLyricsToolbarPinned(false)
        return
      }
      const panelRect = panel.getBoundingClientRect()
      const toolbarHeight = lyricsToolbarRef.current?.offsetHeight || 0
      setLyricsToolbarPinned(panelRect.top < 48 && panelRect.bottom > 48 + toolbarHeight)
    }

    screen.addEventListener('scroll', updateToolbarPosition, { passive: true })
    window.addEventListener('resize', updateToolbarPosition)
    updateToolbarPosition()
    return () => {
      screen.removeEventListener('scroll', updateToolbarPosition)
      window.removeEventListener('resize', updateToolbarPosition)
    }
  }, [])

  const handleSearch = async () => {
    if (!titleQuery.trim() && !artistQuery.trim()) return
    setSearching(true)
    setResults(await onSearchLyrics(titleQuery, artistQuery))
    setSearching(false)
  }

  const openLyricsSearch = () => {
    setTitleQuery(currentTrack?.title || currentTrack?.name.replace(/\.[^/.]+$/, '') || '')
    setArtistQuery(currentTrack?.artist || '')
    setResults([])
    setSearchOpen(true)
  }

  if (!currentTrack) return null

  return (
    <div ref={screenRef} className="fixed inset-0 z-[60] overflow-y-auto bg-neutral-950 px-4 py-4 text-neutral-100 sm:px-8 sm:py-5 lg:px-10">
      <header className="sticky top-0 z-20 mx-auto flex max-w-6xl items-center justify-between gap-3 bg-neutral-950/95 py-2 backdrop-blur lg:static lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white">
          <ArrowDown className="h-5 w-5" /> Miniplayer
        </button>
        <span className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 sm:text-xs sm:tracking-[0.2em]">Now playing</span>
        <div className="w-20 shrink-0 sm:w-24" />
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 py-8 sm:gap-10 sm:py-10 lg:grid-cols-[minmax(280px,min(42vw,460px))_minmax(0,1fr)] lg:items-start lg:gap-12 lg:py-12">
        <section className="min-w-0 text-center">
          <div className="mx-auto aspect-square max-w-[460px] overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-red-950/20">
            {currentTrack.coverUrl ? <img src={currentTrack.coverUrl} alt={`${currentTrack.title} album art`} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-red-500"><Music2 className="h-24 w-24" /></div>}
          </div>
        </section>

        <section ref={lyricsPanelRef} className="order-4 flex h-[min(38vh,300px)] min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 pb-4 pt-6 sm:p-8 lg:order-none lg:col-start-2 lg:row-start-1 lg:h-[min(42vw,460px)]">
          <div className={lyricsToolbarPinned ? 'min-h-[78px]' : ''}>
            <div ref={lyricsToolbarRef} className={`${lyricsToolbarPinned ? 'fixed left-4 right-4 top-12 z-30 sm:left-8 sm:right-8' : 'sticky top-12'} -mx-4 mb-5 shrink-0 bg-neutral-900/95 px-4 pb-2 pt-1 backdrop-blur sm:-mx-8 sm:px-8 lg:static lg:m-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none`}>
            <div className="mb-4"><h2 className="text-lg font-semibold !text-white">Lyrics</h2></div>
            <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-neutral-500">{lyricsLoading ? 'Finding lyrics...' : lyricLines.length ? 'Synced lyrics' : 'No synced lyrics'}</p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs text-neutral-500">Delay</span>
              <button onClick={() => onChangeLyricsDelay(lyricsDelay - 0.5)} aria-label="Move lyrics earlier" className="text-neutral-400 hover:text-white">−</button>
              <input
                type="number"
                min="-10"
                max="10"
                step="0.1"
                value={lyricsDelay}
                onChange={(event) => onChangeLyricsDelay(Number(event.target.value))}
                aria-label="Lyrics delay in seconds"
                className="w-16 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-center text-xs text-white outline-none focus:border-red-500"
              />
              <span className="text-xs text-neutral-500">s</span>
              <button onClick={() => onChangeLyricsDelay(lyricsDelay + 0.5)} aria-label="Move lyrics later" className="text-neutral-400 hover:text-white">+</button>
              <button onClick={openLyricsSearch} className="flex items-center gap-2 text-xs font-medium text-red-400 transition hover:text-red-300"><Search className="h-4 w-4" /> Search</button>
            </div>
            </div>
          </div>
          </div>
          {lyricLines.length > 0 ? (
            <div ref={lyricsScrollRef} className="min-h-0 flex-1 overflow-y-auto pr-3">
              {lyricLines.map((line, index) => {
                const activeWordIndex = line.words?.reduce((active, word, wordIndex) => (word.time + lyricsDelay <= currentTime ? wordIndex : active), -1) ?? -1
                const lineClassName = line.words?.length
                  ? 'text-neutral-500'
                  : index === activeIndex ? 'font-bold text-white' : 'text-neutral-500'
                return <p ref={(element) => { lineRefs.current[index] = element }} key={`${line.time}-${index}`} className={`max-w-full break-words whitespace-normal py-1 text-lg leading-8 transition-colors ${lineClassName}`}>
                  {line.words?.length ? line.words.map((word, wordIndex) => <span key={`${word.time}-${wordIndex}`} className={`transition-colors ${index === activeIndex && wordIndex === activeWordIndex ? 'font-bold text-white' : index === activeIndex && wordIndex < activeWordIndex ? 'text-neutral-300' : ''}`}>{word.text}</span>) : line.text || '\u00a0'}
                </p>
              })}
            </div>
          ) : lyrics ? <p className="whitespace-pre-wrap text-neutral-300">{lyrics}</p> : <p className="text-sm text-neutral-500">No lyrics found for this song.</p>}
        </section>

        <section className="contents lg:col-span-2 lg:row-start-2 lg:flex lg:items-center lg:justify-between lg:gap-5 lg:border-t lg:border-neutral-800 lg:pt-5">
          <div className="order-2 min-w-0 border-t border-neutral-800 pt-5 text-left lg:order-none lg:w-[38%] lg:border-t-0 lg:pt-0">
            <p className="truncate text-2xl font-bold text-white sm:text-3xl">{currentTrack.title || currentTrack.name}</p>
            <p className="mt-2 truncate text-base text-neutral-400 sm:text-lg">{currentTrack.artist} · {currentTrack.album}</p>
            {currentTrack.sampleRate && currentTrack.bitDepth && (
              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
                {!isMp3Track(currentTrack) && (
                  <span className="rounded-md bg-neutral-700 px-2 py-1 font-semibold tracking-wide text-neutral-200">
                    {currentTrack.sampleRate >= 48000 || currentTrack.bitDepth > 16 ? 'HI-RES' : 'LOSSLESS'}
                  </span>
                )}
                <span>{formatSampleRate(currentTrack.sampleRate)} · {currentTrack.bitDepth}-bit</span>
              </div>
            )}
          </div>
          <div className="order-3 flex min-w-0 flex-1 flex-col gap-3 lg:order-none lg:max-w-3xl">
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              <button onClick={onPrevious} aria-label="Previous song" className="text-neutral-300 transition hover:text-white"><ChevronLeft className="h-8 w-8" /></button>
              <button onClick={onTogglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'} className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-950 transition hover:scale-105">
                {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-1 h-7 w-7 fill-current" />}
              </button>
              <button onClick={onNext} aria-label="Next song" className="text-neutral-300 transition hover:text-white"><ChevronRight className="h-8 w-8" /></button>
              <button
                onClick={onToggleRepeat}
                aria-label={`Repeat ${repeatMode === 'all' ? 'playlist' : repeatMode}`}
                title={`Repeat ${repeatMode === 'all' ? 'playlist' : repeatMode}`}
                className={`ml-2 text-neutral-400 transition hover:text-white ${repeatMode !== 'off' ? 'text-red-400' : ''}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
              </button>
            </div>
            <div className="w-full">
              <div className="relative flex items-center">
                <div className="absolute left-0 right-0 h-1 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full bg-neutral-600/70 transition-[width] duration-300" style={{ width: `${bufferedPercent}%` }} />
                </div>
                <div className="pointer-events-none absolute left-0 z-0 h-1 rounded-full bg-red-500 transition-[width] duration-100" style={{ width: `${playedPercent}%` }} />
                <input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => onSeek(Number(event.target.value))} disabled={!duration} aria-label="Track progress" className="relative z-10 h-1 w-full min-w-0 cursor-pointer appearance-none bg-transparent [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
              </div>
              <div className="mt-1 flex justify-between text-xs text-neutral-500"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
            </div>
          </div>
        </section>
      </div>
      {searchOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-label="Search lyrics">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Search Lyrics</h2><button onClick={() => setSearchOpen(false)} aria-label="Close search"><X className="h-5 w-5 text-neutral-400 hover:text-white" /></button></div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2"><input autoFocus value={titleQuery} onChange={(event) => setTitleQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void handleSearch() }} placeholder="Song title" className="min-w-0 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm !text-white caret-white placeholder:text-neutral-500 outline-none [color-scheme:dark] focus:border-red-500" /><input value={artistQuery} onChange={(event) => setArtistQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void handleSearch() }} placeholder="Artist name" className="min-w-0 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm !text-white caret-white placeholder:text-neutral-500 outline-none [color-scheme:dark] focus:border-red-500" /></div><button onClick={() => void handleSearch()} disabled={searching} className="mt-2 flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold !text-white disabled:opacity-50">{searching && <LoaderCircle className="h-4 w-4 animate-spin" />} Search Lyrics</button>
            <div className="mt-5 max-h-80 space-y-2 overflow-y-auto">{results.map((result, index) => <button key={`${result.id || result.trackName}-${index}`} onClick={() => { onSelectLyrics(result); setSearchOpen(false) }} className="w-full rounded-lg border border-neutral-800 p-3 text-left transition hover:border-red-500/60 hover:bg-neutral-800"><p className="font-medium text-white">{result.trackName}</p><p className="text-xs text-neutral-400">{result.artistName}{result.albumName ? ` · ${result.albumName}` : ''}</p></button>)}{!searching && (titleQuery || artistQuery) && results.length === 0 && <p className="text-sm text-neutral-500">No matching lyrics found.</p>}</div>
          </div>
        </div>
      )}
    </div>
  )
}