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
