export interface LyricLine {
  time: number
  text: string
}

export interface LrclibResult {
  id?: number
  trackName: string
  artistName: string
  albumName?: string
  duration?: number
  instrumental?: boolean
  plainLyrics?: string | null
  syncedLyrics?: string | null
}

const API_URL = 'https://lrclib.net/api'

function normalizeSearchText(value: string): string {
  return value.replace(/;/g, ',').trim()
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url)
  if (!response.ok) return null
  return response.json() as Promise<T>
}

export async function searchLrclib(query: string): Promise<LrclibResult[]> {
  const url = `${API_URL}/search?q=${encodeURIComponent(normalizeSearchText(query))}`
  return (await fetchJson<LrclibResult[]>(url)) || []
}

export async function fetchAutoLyrics(
  trackTitle: string,
  artistName: string,
  duration?: number,
): Promise<LrclibResult | null> {
  const params = new URLSearchParams({ track_name: normalizeSearchText(trackTitle), artist_name: normalizeSearchText(artistName) })
  if (duration && Number.isFinite(duration)) params.set('duration', String(Math.round(duration)))

  const directMatch = await fetchJson<LrclibResult>(`${API_URL}/get?${params.toString()}`)
  if (directMatch?.syncedLyrics || directMatch?.plainLyrics) return directMatch

  const results = await searchLrclib(`${artistName} ${trackTitle}`)
  return results.find((result) => result.syncedLyrics || result.plainLyrics) || null
}

export function parseLrc(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = []

  for (const rawLine of lrcText.split(/\r?\n/)) {
    const matches = [...rawLine.matchAll(/\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g)]
    const text = rawLine.replace(/(?:\[\d+:\d{2}(?:[.:]\d{1,3})?\])+\s*/, '').trim()

    for (const match of matches) {
      const fraction = match[3] ? Number(match[3].padEnd(3, '0')) / 1000 : 0
      lines.push({ time: Number(match[1]) * 60 + Number(match[2]) + fraction, text })
    }
  }

  return lines.sort((left, right) => left.time - right.time)
}