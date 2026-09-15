import { Download, Library, ListMusic, Mic2, Disc3, Search, Music2 } from 'lucide-react'

export type TabType = 'library' | 'playlists' | 'artists' | 'albums'

interface SidebarProps {
  activeTab: TabType
  onSelectTab: (tab: TabType) => void
}

export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-wrap items-center gap-3 border-b border-neutral-800 bg-neutral-900/50 p-3 backdrop-blur-md sm:p-4 md:h-screen md:w-64 md:flex-col md:items-stretch md:gap-6 md:border-b-0 md:border-r md:pb-24 md:overflow-y-auto">
      <div className="flex items-center gap-2 px-2">
        <Music2 className="h-6 w-6 text-red-500" />
        <span className="font-bold text-lg tracking-tight">Pear Music</span>
      </div>

      <div className="relative w-full md:w-auto">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-neutral-800/80 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-neutral-200 placeholder-neutral-500"
        />
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