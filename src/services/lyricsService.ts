export interface LyricWord {
  time: number
  text: string
}

export interface LyricLine {
  time: number
  text: string
  words?: LyricWord[]
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
  const lineTimestampPattern = /\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g
  const wordTimestampPattern = /<(\d+):(\d{2})(?:[.:](\d{1,3}))?>/g

  const toSeconds = (minutes: string, seconds: string, fraction?: string) =>
    Number(minutes) * 60 + Number(seconds) + (fraction ? Number(fraction.padEnd(3, '0')) / 1000 : 0)

  for (const rawLine of lrcText.split(/\r?\n/)) {
    const lineMatches = [...rawLine.matchAll(lineTimestampPattern)]
    const text = rawLine.replace(/(?:\[\d+:\d{2}(?:[.:]\d{1,3})?\])+\s*/, '').trim()
    const wordMatches = [...text.matchAll(wordTimestampPattern)]
    const words = wordMatches.map((match, index) => {
      const nextStart = wordMatches[index + 1]?.index ?? text.length
      return {
        time: toSeconds(match[1], match[2], match[3]),
        text: text.slice((match.index ?? 0) + match[0].length, nextStart),
      }
    }).filter((word) => word.text.trim().length > 0)

    for (const match of lineMatches) {
      const time = toSeconds(match[1], match[2], match[3])
      lines.push({ time, text: words.length ? words.map((word) => word.text).join('') : text, words: words.length ? words : undefined })
    }
  }

  return lines.sort((left, right) => left.time - right.time)
}