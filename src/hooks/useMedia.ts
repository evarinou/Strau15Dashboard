// Hooks der Medien-Seite (Phase 3). Gleiche Konvention wie useBff:
// 503 {disabled:true} → null, die jeweilige Karte blendet sich aus.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBff } from './useBff'

export interface MediaItem {
  id: string
  type: 'movie' | 'episode' | 'series'
  title: string
  subtitle: string | null
  /** 0–100, nur bei „Weiterschauen" */
  progress: number | null
  /** ISO-Datum, nur bei „zuletzt hinzugefügt" */
  addedAt: string | null
  /** BFF-Proxy-Pfad oder null (dann Platzhalter zeigen) */
  image: string | null
}

export interface MediaStatus {
  watching: boolean
  upcoming: boolean
  wish: boolean
}

/** Welche Bereiche der Medien-Seite serverseitig konfiguriert sind */
export function useMediaStatus() {
  return useQuery({
    queryKey: ['bff', 'media', 'status'],
    queryFn: () => fetchBff<MediaStatus>('/api/media/status'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useMediaWatching() {
  return useQuery({
    queryKey: ['bff', 'media', 'watching'],
    queryFn: () =>
      fetchBff<{ watching: MediaItem[]; latest: MediaItem[] }>('/api/media/continue'),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  })
}

export interface UpcomingItem {
  source: 'sonarr' | 'radarr'
  id: number
  title: string
  subtitle: string | null
  date: string
  hasFile: boolean
  image: string
}

export interface UpcomingResponse {
  items: UpcomingItem[]
  /** false = Dienst konfiguriert, aber gerade nicht erreichbar */
  sources: { sonarr: boolean; radarr: boolean }
}

export function useMediaUpcoming(days = 14) {
  return useQuery({
    queryKey: ['bff', 'media', 'upcoming', days],
    queryFn: () => fetchBff<UpcomingResponse>(`/api/media/upcoming?days=${days}`),
    staleTime: 15 * 60 * 1000,
  })
}

export type SearchStatus = 'none' | 'pending' | 'processing' | 'partial' | 'available'

export interface SearchResult {
  id: number
  mediaType: 'movie' | 'tv'
  title: string
  year: string | null
  overview: string
  status: SearchStatus
  image: string | null
}

export function useMediaSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['bff', 'media', 'search', trimmed],
    queryFn: () =>
      fetchBff<{ results: SearchResult[] }>(
        `/api/media/search?query=${encodeURIComponent(trimmed)}`
      ),
    enabled: trimmed.length >= 2,
    staleTime: 60 * 1000,
  })
}

export interface MediaRequestInput {
  mediaType: 'movie' | 'tv'
  mediaId: number
}

export function useMediaRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: MediaRequestInput) => {
      const response = await fetch('/api/media/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean
        error?: string
      } | null
      if (!response.ok) {
        throw new Error(body?.error ?? `Anfrage fehlgeschlagen (${response.status})`)
      }
      return body
    },
    onSuccess: () => {
      // Suchergebnisse neu laden, damit der Seerr-Status (pending) nachzieht
      queryClient.invalidateQueries({ queryKey: ['bff', 'media', 'search'] })
    },
  })
}
