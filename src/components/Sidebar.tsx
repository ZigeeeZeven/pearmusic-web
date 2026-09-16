import { Download, Library, ListMusic, Mic2, Disc3, Search, Music2 } from 'lucide-react'
import { useState, type MouseEvent, type ReactNode } from 'react'
import type { Track } from '../services/localMusicService'

export type TabType = 'library' | 'playlists' | 'artists' | 'albums'

interface SidebarProps {
  activeTab: TabType
  onSelectTab: (tab: TabType) => void
  tracks: Track[]
  onPlayTrack: (track: Track, queue: Track[]) => void
  onOpenArtist: (artist: string) => void
  onOpenAlbum: (album: string) => void
}

export function Sidebar({ activeTab, onSelectTab, tracks, onPlayTrack, onOpenArtist, onOpenAlbum }: SidebarProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const matchingSongs = normalizedQuery
    ? tracks.filter((track) => track.title.toLowerCase().includes(normalizedQuery)).slice(0, 8)
    : []
  const matchingArtists = normalizedQuery
    ? [...new Set(tracks.filter((track) => track.artist.toLowerCase().includes(normalizedQuery)).map((track) => track.artist))].slice(0, 5)
    : []
  const matchingAlbums = normalizedQuery
    ? [...new Set(tracks.filter((track) => track.album.toLowerCase().includes(normalizedQuery)).map((track) => track.album))].slice(0, 5)
    : []
  const matchingTracks = tracks.filter((track) => matchingSongs.some((song) => song.id === track.id) || matchingAlbums.includes(track.album) || matchingArtists.includes(track.artist))
  const hasResults = matchingArtists.length > 0 || matchingAlbums.length > 0 || matchingSongs.length > 0

  const closeSearch = () => setQuery('')

  return (
    <aside className="sticky top-0 z-40 flex w-full shrink-0 flex-wrap items-center gap-3 border-b border-neutral-800 bg-neutral-900/95 p-3 backdrop-blur-md sm:p-4 md:h-screen md:w-64 md:flex-col md:items-stretch md:gap-6 md:border-b-0 md:border-r md:pb-24 md:overflow-y-auto">
      <div className="flex items-center gap-2 px-2">
        <Music2 className="h-6 w-6 text-red-500" />
        <span className="font-bold text-lg tracking-tight">Pear Music</span>
      </div>

      <div className="relative z-30 w-full md:w-auto">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search music"
          className="w-full bg-neutral-800/80 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-neutral-200 placeholder-neutral-500"
        />
        {normalizedQuery && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-950 p-2 text-left shadow-2xl shadow-black/40 md:w-80">
            {hasResults ? (
              <>
                {matchingSongs.length > 0 && (
                  <SearchGroup title="Music">
                    {matchingSongs.map((track) => <SearchResult key={track.id} name={track.title || track.name} subtitle={track.artist} coverUrl={track.coverUrl} onMouseDown={(event) => event.preventDefault()} onClick={() => { onPlayTrack(track, tracks); closeSearch() }} />)}
                  </SearchGroup>
                )}
                {matchingAlbums.length > 0 && (
                  <SearchGroup title="Album">
                    {matchingAlbums.map((album) => {
                      const albumTrack = matchingTracks.find((track) => track.album === album)
                      return <SearchResult key={album} name={album} subtitle={albumTrack?.artist || 'Album'} coverUrl={albumTrack?.coverUrl} onMouseDown={(event) => event.preventDefault()} onClick={() => { onOpenAlbum(album); closeSearch() }} />
                    })}
                  </SearchGroup>
                )}
                {matchingArtists.length > 0 && (
                  <SearchGroup title="Artist">
                    {matchingArtists.map((artist) => {
                      const artistTrack = matchingTracks.find((track) => track.artist === artist)
                      return <SearchResult key={artist} name={artist} subtitle="Artist" coverUrl={artistTrack?.coverUrl} onMouseDown={(event) => event.preventDefault()} onClick={() => { onOpenArtist(artist); closeSearch() }} />
                    })}
                  </SearchGroup>
                )}
              </>
            ) : <p className="px-3 py-4 text-sm text-neutral-500">No matching music found.</p>}
          </div>
        )}
      </div>

      <nav className="flex min-w-0 flex-1 flex-wrap gap-1 md:block md:space-y-1">
        <button
          onClick={() => onSelectTab('library')}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:w-full md:gap-3 ${
            activeTab === 'library' ? 'bg-red-500/10 text-red-500' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Library className="h-5 w-5" /> Library
        </button>
        <button
          onClick={() => onSelectTab('playlists')}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:w-full md:gap-3 ${
            activeTab === 'playlists' ? 'bg-red-500/10 text-red-500' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ListMusic className="h-5 w-5" /> Playlists
        </button>
        <button
          onClick={() => onSelectTab('artists')}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:w-full md:gap-3 ${
            activeTab === 'artists' ? 'bg-red-500/10 text-red-500' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Mic2 className="h-5 w-5" /> Artists
        </button>
        <button
          onClick={() => onSelectTab('albums')}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:w-full md:gap-3 ${
            activeTab === 'albums' ? 'bg-red-500/10 text-red-500' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Disc3 className="h-5 w-5" /> Albums
        </button>
      </nav>
      <a
        href="https://github.com/ZigeeeZeven/pearmusic"
        target="_blank"
        rel="noreferrer"
        className="flex w-full shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200 md:mt-auto md:gap-3"
      >
        <Download className="h-5 w-5 shrink-0" /> Download Pear Music Android App
      </a>
    </aside>
  )
}

function SearchGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-neutral-800 py-3 last:border-b-0">
      <h2 className="px-3 pb-2 text-sm font-bold !text-white">{title}</h2>
      {children}
    </section>
  )
}

function SearchResult({ name, subtitle, coverUrl, onMouseDown, onClick }: { name: string; subtitle: string; coverUrl?: string; onMouseDown: (event: MouseEvent<HTMLButtonElement>) => void; onClick: () => void }) {
  return (
    <button onMouseDown={onMouseDown} onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-neutral-800">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-800 text-red-400">
        {coverUrl ? <img src={coverUrl} alt="" className="h-full w-full object-cover" /> : <Music2 className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <span className="block truncate text-sm text-neutral-100">{name}</span>
        <span className="block truncate text-xs text-neutral-500">{subtitle}</span>
      </div>
    </button>
  )
}