import { parseWebStream } from 'music-metadata'

export interface Track {
  id: string
  name: string
  mimeType: string
  size?: string
  title: string
  artist: string
  album: string
  coverUrl?: string
  blobUrl?: string
  streamUrl?: string
  lyrics?: string
  resourceKey?: string
  webContentLink?: string
  sampleRate?: number
  bitDepth?: number
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  resourceKey?: string
  webContentLink?: string
}

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
let driveAccessToken: string | null = null
export const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '1jlKwbZVegXvz6DFhwwrCItmB4ADp9Sre'
const DRIVE_API_ORIGIN = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? '/drive-api'
  : 'https://www.googleapis.com'

export function setDriveAccessToken(token: string | null): void {
  driveAccessToken = token
}

function driveRequestInit(): RequestInit {
  return driveAccessToken ? { headers: { Authorization: `Bearer ${driveAccessToken}` } } : {}
}

export function getAudioStreamUrl(fileId: string, resourceKey?: string): string {
  const url = new URL(`${DRIVE_API_ORIGIN}/drive/v3/files/${encodeURIComponent(fileId)}`, typeof window !== 'undefined' ? window.location.origin : 'https://www.googleapis.com')
  url.searchParams.set('alt', 'media')
  url.searchParams.set('supportsAllDrives', 'true')
  if (API_KEY) url.searchParams.set('key', API_KEY)
  if (resourceKey) url.searchParams.set('resourceKey', resourceKey)
  return url.toString()
}

function getPublicDownloadUrl(fileId: string, resourceKey?: string): string {
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  const baseUrl = isLocal
    ? `${window.location.origin}/drive-download/uc`
    : 'https://drive.google.com/uc'
  const url = new URL(baseUrl)
  url.searchParams.set('export', 'download')
  url.searchParams.set('id', fileId)
  if (resourceKey) url.searchParams.set('resourcekey', resourceKey)
  return url.toString()
}

export function parseTrackFromFilename(file: DriveFile & { size?: string }): Track {
  const cleanName = file.name.replace(/\.[^/.]+$/, '')
  let artist = 'Google Drive Audio'
  let title = cleanName
  if (cleanName.includes(' - ')) {
    const parts = cleanName.split(' - ')
    artist = parts[0].trim()
    title = parts.slice(1).join(' - ').trim()
  }
  return { ...file, title, artist, album: 'Single' }
}

export async function prepareTrackForPlayback(track: Track): Promise<Track> {
  return {
    ...track,
    streamUrl: track.streamUrl || getPublicDownloadUrl(track.id, track.resourceKey),
  }
}

export async function fetchDriveText(fileId: string, resourceKey?: string): Promise<string> {
  const urls = [getAudioStreamUrl(fileId, resourceKey), getPublicDownloadUrl(fileId, resourceKey)]
  let lastStatus = 0
  for (const url of urls) {
    try {
      const response = await fetch(url, driveRequestInit())
      if (response.ok) return (await response.text()).replace(/^\uFEFF/, '')
      lastStatus = response.status
    } catch {
      lastStatus = 0
    }
  }
  throw new Error(`HTTP ${lastStatus || 502}`)
}

export async function fetchDriveContents(folderId: string = FOLDER_ID): Promise<{ tracks: Track[]; playlists: DriveFile[]; lyrics: DriveFile[] }> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`)
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,size,resourceKey,webContentLink)&key=${API_KEY}`
  const response = await fetch(url, driveRequestInit())
  if (!response.ok) throw new Error('Failed to fetch Drive items')
  const data = await response.json()
  const files: DriveFile[] = data.files || []
  const tracks: Track[] = []
  const playlists: DriveFile[] = []
  const lyrics: DriveFile[] = []
  files.forEach((file) => {
    if (file.name.endsWith('.m3u8') || file.name.endsWith('.m3u')) playlists.push(file)
    else if (file.name.endsWith('.lrc')) lyrics.push(file)
    else if (file.mimeType.includes('audio/') || file.name.match(/\.(flac|mp3|m4a|wav|ogg)$/i)) tracks.push(parseTrackFromFilename(file))
  })
  return { tracks, playlists, lyrics }
}

export async function parseM3U8File(fileId: string, resourceKey?: string): Promise<string[]> {
  const text = await fetchDriveText(fileId, resourceKey)
  const entries = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      try {
        return decodeURIComponent(line)
      } catch {
        return line
      }
    })
  const seen = new Set<string>()
  return entries.filter((entry) => {
    const key = entry.trim().replace(/\?.*$/, '').replace(/[\\/]+/g, '/').toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchAudioBlobUrl(fileId: string, resourceKey?: string): Promise<string> {
  const urls = [getAudioStreamUrl(fileId, resourceKey), getPublicDownloadUrl(fileId, resourceKey)].filter((url): url is string => Boolean(url))
  let lastStatus = 0
  for (const url of urls) {
    try {
      const response = await fetch(url, driveRequestInit())
      if (response.ok) return URL.createObjectURL(await response.blob())
      lastStatus = response.status
    } catch {
      lastStatus = 0
    }
  }
  throw new Error(`HTTP ${lastStatus || 502}`)
}

export async function loadTrackMetadata(track: Track): Promise<Track> {
  if (track.coverUrl) return track
  try {
    const blobUrl = await fetchAudioBlobUrl(track.id, track.resourceKey)
    const response = await fetch(blobUrl)
    if (!response.ok) return track
    const blob = await response.blob()
    URL.revokeObjectURL(blobUrl)
    let coverUrl: string | undefined
    let title = track.title
    let artist = track.artist
    let album = track.album
    const metadata = await parseWebStream(blob.stream(), { mimeType: track.mimeType, size: blob.size })
    const sampleRate = metadata.format.sampleRate
    const bitDepth = metadata.format.bitsPerSample
    if (metadata.common.title) title = metadata.common.title
    if (metadata.common.artist) artist = metadata.common.artist
    if (metadata.common.album) album = metadata.common.album
    if (metadata.common.picture?.length) {
      const picture = metadata.common.picture[0]
      const imageBlob = new Blob([new Uint8Array(picture.data as unknown as ArrayBuffer)], { type: picture.format })
      coverUrl = URL.createObjectURL(imageBlob)
    }
    return { ...track, title, artist, album, coverUrl, sampleRate, bitDepth }
  } catch {
    return track
  }
}