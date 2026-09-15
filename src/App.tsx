import { useEffect, useState, useRef } from 'react'
import { Howl } from 'howler'
import {
  fetchDriveContents,
  fetchDriveText,
  fetchAudioBlobUrl,
  loadTrackMetadata,
  prepareTrackForPlayback,
  type Track,
  type DriveFile,
} from './services/driveService'

import { Sidebar, type TabType } from './components/Sidebar'
import { PlayerBar, type RepeatMode } from './components/PlayerBar'
import { LibraryView } from './components/views/LibraryView'
import { PlaylistsView } from './components/views/PlaylistsView'
import { ArtistsView } from './components/views/ArtistsView'
import { AlbumsView } from './components/views/AlbumsView'
import { NowPlayingScreen } from './components/NowPlayingScreen'
import { fetchAutoLyrics, parseLrc, searchLrclib, type LrclibResult, type LyricLine } from './services/lyricsService'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('library')
  const [tracks, setTracks] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([])
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedTime, setBufferedTime] = useState(0)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off')
  const [lyricsDelays, setLyricsDelays] = useState<Record<string, number>>({})
  const [lyricFiles, setLyricFiles] = useState<DriveFile[]>([])
  const [showNowPlaying, setShowNowPlaying] = useState(false)
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const soundRef = useRef<Howl | null>(null)
  const currentTrackRef = useRef<Track | null>(null)
  const tracksRef = useRef<Track[]>([])
  const queueRef = useRef<Track[]>([])
  const lyricRequestRef = useRef(0)
  const repeatModeRef = useRef<RepeatMode>('off')
  useEffect(() => {
    async function init() {
      try {
        const contents = await fetchDriveContents()
        setTracks(contents.tracks)
        setPlaylists(contents.playlists)
        setLyricFiles(contents.lyrics)
        setLoading(false)

        for (let index = 0; index < contents.tracks.length; index += 4) {
          const batch = contents.tracks.slice(index, index + 4)
          const hydratedTracks = await Promise.all(batch.map((track) => loadTrackMetadata(track)))
          setTracks((previous) => previous.map((track) => {
            const hydratedTrack = hydratedTracks.find((item) => item.id === track.id)
            return hydratedTrack ? { ...track, ...hydratedTrack } : track
          }))
        }
      } catch (err) {
        console.error('Failed to load drive contents:', err)
        setLoadError(err instanceof Error ? err.message : 'Unable to load Google Drive contents.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!currentTrack) return

    const updatePosition = () => {
      const sound = soundRef.current
      const position = sound?.seek()
      if (typeof position === 'number' && isPlaying) setCurrentTime(position)
      const mediaNode = (sound as unknown as { _sounds?: Array<{ _node?: HTMLMediaElement | null }> } | null)?._sounds?.[0]?._node
      if (mediaNode && mediaNode.buffered.length > 0) setBufferedTime(mediaNode.buffered.end(mediaNode.buffered.length - 1))
    }
    updatePosition()
    const timer = window.setInterval(updatePosition, 100)
    return () => window.clearInterval(timer)
  }, [currentTrack, isPlaying])

  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])

  useEffect(() => {
    currentTrackRef.current = currentTrack
    tracksRef.current = tracks
  }, [currentTrack, tracks])

  const loadLyricsForTrack = async (track: Track) => {
    const requestId = lyricRequestRef.current + 1
    lyricRequestRef.current = requestId
    setLyrics(null)
    setLyricLines([])
    setLyricsLoading(true)

    try {
      const autoLyrics = await fetchAutoLyrics(track.title, track.artist)
      const autoText = autoLyrics?.syncedLyrics || autoLyrics?.plainLyrics
      if (autoText) {
        if (requestId !== lyricRequestRef.current) return
        setLyrics(autoText)
        setLyricLines(parseLrc(autoText))
        return
      }

      const lyricFile = lyricFiles.find((file) => {
        const lyricName = file.name.replace(/\.lrc$/i, '').toLowerCase()
        const trackNames = [track.title, track.name.replace(/\.[^/.]+$/, '')].map((name) => name.toLowerCase())
        return trackNames.some((name) => lyricName === name || lyricName.includes(name) || name.includes(lyricName))
      })
      if (lyricFile) {
        const driveLyrics = await fetchDriveText(lyricFile.id, lyricFile.resourceKey)
        if (requestId !== lyricRequestRef.current) return
        setLyrics(driveLyrics)
        setLyricLines(parseLrc(driveLyrics))
      }
    } catch (err) {
      console.warn('Lyrics lookup failed:', err)
    } finally {
      if (requestId === lyricRequestRef.current) setLyricsLoading(false)
    }
  }

  const handlePlayTrack = async (track: Track, queue: Track[] = tracksRef.current) => {
    queueRef.current = queue
    if (currentTrackRef.current?.id === track.id && soundRef.current) {
      if (isPlaying) {
        soundRef.current.pause()
        setIsPlaying(false)
      } else {
        soundRef.current.play()
        setIsPlaying(true)
      }
      return
    }

    if (soundRef.current) {
      soundRef.current.unload()
    }

    setLoadingTrackId(track.id)
    setPlaybackError(null)
    try {
      const preparedTrack = await prepareTrackForPlayback(track)
      currentTrackRef.current = preparedTrack
      setCurrentTrack(preparedTrack)
      setCurrentTime(0)
      setDuration(0)
      setBufferedTime(0)

      setTracks((prev) =>
        prev.map((t) => (t.id === preparedTrack.id ? preparedTrack : t))
      )

      let fallbackAttempted = false
      const sound = new Howl({
        src: [preparedTrack.streamUrl || ''],
        format: ['flac', 'mp3', 'm4a', 'wav', 'ogg'],
        html5: true,
        onplay: () => setIsPlaying(true),
        onpause: () => setIsPlaying(false),
        onload: () => {
          const trackDuration = sound.duration()
          if (typeof trackDuration === 'number') setDuration(trackDuration)
        },
        onend: () => {
          if (repeatModeRef.current === 'one') {
            sound.seek(0)
            setCurrentTime(0)
            sound.play()
          } else {
            void playNextTrack()
          }
        },
        onloaderror: (_id: number, err: unknown) => {
          console.error('Audio load error:', err)
          if (fallbackAttempted) {
            setPlaybackError('This audio file could not be loaded.')
            return
          }
          fallbackAttempted = true
          void fetchAudioBlobUrl(preparedTrack.id, preparedTrack.resourceKey).then((blobUrl) => {
            sound.unload()
            const fallbackSound = new Howl({
              src: [blobUrl],
              format: ['flac', 'mp3', 'm4a', 'wav', 'ogg'],
              onplay: () => setIsPlaying(true),
              onpause: () => setIsPlaying(false),
              onend: () => void playNextTrack(),
              onload: () => setDuration(fallbackSound.duration()),
              onloaderror: () => setPlaybackError('This audio file could not be decoded.'),
            })
            soundRef.current = fallbackSound
            fallbackSound.play()
          }).catch((fallbackError) => setPlaybackError(fallbackError instanceof Error ? fallbackError.message : 'Unable to load this song.'))
        },
      })

      soundRef.current = sound
      sound.play()
      void loadLyricsForTrack(preparedTrack)
      void loadTrackMetadata(preparedTrack).then((metadataTrack) => {
        setCurrentTrack((current) => current?.id === metadataTrack.id ? { ...current, ...metadataTrack } : current)
        setTracks((previous) => previous.map((item) => item.id === metadataTrack.id ? { ...item, ...metadataTrack } : item))
      }).catch((err) => console.warn('Background metadata lookup failed:', err))
    } catch (err) {
      console.error('Playback error:', err)
      setPlaybackError(err instanceof Error ? err.message : 'Unable to play this song. Check your Google Drive configuration.')
    } finally {
      setLoadingTrackId(null)
    }
  }

  const togglePlayPause = () => {
    if (!soundRef.current) return
    if (isPlaying) {
      soundRef.current.pause()
    } else {
      soundRef.current.play()
    }
  }

  const playAdjacent = (direction: -1 | 1) => {
    const queue = queueRef.current
    if (!currentTrack || queue.length === 0) return
    const currentIndex = queue.findIndex((track) => track.id === currentTrack.id)
    const nextIndex = (currentIndex + direction + queue.length) % queue.length
    void handlePlayTrack(queue[nextIndex], queue)
  }

  const playNextTrack = () => {
    const playingTrack = currentTrackRef.current
    const queue = queueRef.current
    if (!playingTrack || queue.length === 0) return
    const currentIndex = queue.findIndex((track) => track.id === playingTrack.id)
    const nextIndex = currentIndex + 1
    const shouldWrap = repeatModeRef.current === 'all'

    if (nextIndex >= tracks.length && !shouldWrap) {
      setIsPlaying(false)
      return
    }

    void handlePlayTrack(queue[shouldWrap ? nextIndex % queue.length : nextIndex])
  }

  const handleSeek = (time: number) => {
    if (!soundRef.current) return
    soundRef.current.seek(time)
    setCurrentTime(time)
  }

  const toggleRepeat = () => {
    setRepeatMode((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'))
  }

  const handleSearchLyrics = (title: string, artist: string) => searchLrclib(`${artist} ${title}`)

  const handleSelectLyrics = (result: LrclibResult) => {
    const text = result.syncedLyrics || result.plainLyrics || ''
    setLyrics(text)
    setLyricLines(parseLrc(text))
  }

  const handleChangeLyricsDelay = (delay: number) => {
    const normalizedDelay = Math.max(-10, Math.min(10, Number.isFinite(delay) ? delay : 0))
    if (currentTrack) {
      setLyricsDelays((previous) => ({ ...previous, [currentTrack.id]: normalizedDelay }))
    }
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-neutral-950 font-sans text-neutral-100 antialiased select-none md:h-screen md:flex-row">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-28 md:p-8 md:pb-32">
        {loading ? (
          <p className="text-neutral-500">Scanning Google Drive...</p>
        ) : loadError ? (
          <div className="max-w-xl rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-left">
            <h1 className="text-lg font-semibold text-red-200">Could not load your library</h1>
            <p className="mt-2 text-sm text-red-300">{loadError}</p>
            <p className="mt-3 text-sm text-neutral-400">Add VITE_GOOGLE_API_KEY to your environment and make sure the Drive folder is accessible with that key.</p>
          </div>
        ) : (
          <>
            {activeTab === 'library' && (
              <LibraryView
                tracks={tracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayTrack={(track) => handlePlayTrack(track, tracks)}
                loadingTrackId={loadingTrackId}
                playbackError={playbackError}
              />
            )}
            {activeTab === 'playlists' && (
              <PlaylistsView playlists={playlists} tracks={tracks} onPlayTrack={handlePlayTrack} />
            )}
            {activeTab === 'artists' && (
              <ArtistsView tracks={tracks} />
            )}
            {activeTab === 'albums' && (
              <AlbumsView tracks={tracks} />
            )}
          </>
        )}
      </main>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
        onPrevious={() => playAdjacent(-1)}
        onNext={() => playAdjacent(1)}
        onOpen={() => setShowNowPlaying(true)}
        onOpenLyrics={() => setShowNowPlaying(true)}
        currentTime={currentTime}
        duration={duration}
        bufferedTime={bufferedTime}
        onSeek={handleSeek}
        repeatMode={repeatMode}
        onToggleRepeat={toggleRepeat}
      />
      {showNowPlaying && (
        <NowPlayingScreen
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          lyrics={lyrics}
          lyricLines={lyricLines}
          currentTime={currentTime}
          duration={duration}
          bufferedTime={bufferedTime}
          lyricsDelay={currentTrack ? lyricsDelays[currentTrack.id] ?? 0 : 0}
          lyricsLoading={lyricsLoading}
          onSeek={handleSeek}
          onChangeLyricsDelay={handleChangeLyricsDelay}
          onSearchLyrics={handleSearchLyrics}
          onSelectLyrics={handleSelectLyrics}
          onClose={() => setShowNowPlaying(false)}
          onTogglePlayPause={togglePlayPause}
          onPrevious={() => playAdjacent(-1)}
          onNext={() => playAdjacent(1)}
        />
      )}
    </div>
  )
}