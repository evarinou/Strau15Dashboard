// Hooks der Medien-Seite (Phase 3). Gleiche Konvention wie useBff:
// 503 {disabled:true} → null, die jeweilige Karte blendet sich aus.

import { useQuery } from '@tanstack/react-query'
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
