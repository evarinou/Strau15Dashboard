// Dünne TanStack-Query-Wrapper für die BFF-Endpoints der Startseite.
// Ein 503 mit {disabled:true} bedeutet: Feature serverseitig nicht
// konfiguriert → Hook liefert null, die Karte blendet sich aus.

import { useQuery } from '@tanstack/react-query'

async function fetchBff<T>(url: string): Promise<T | null> {
  const response = await fetch(url)
  if (response.status === 503) return null
  if (!response.ok) throw new Error(`BFF ${url}: ${response.status}`)
  return response.json()
}

export interface Briefing {
  text: string | null
  generatedAt: string | null
  stale: boolean
  fallback: boolean
  data?: {
    kalender?: { kommend7Tage: { titel: string; start: string }[] }
    choreQuest?: { heuteOffen: string[] } | null
  }
}

export function useBriefing() {
  return useQuery({
    queryKey: ['bff', 'briefing'],
    queryFn: () => fetchBff<Briefing>('/api/briefing'),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  })
}

export interface MemoryPhoto {
  id: string
  year: number
  takenAt: string
}

export function usePhotos() {
  return useQuery({
    queryKey: ['bff', 'photos'],
    queryFn: () => fetchBff<{ photos: MemoryPhoto[] }>('/api/photos/today'),
    staleTime: 60 * 60 * 1000,
  })
}

export interface CalendarEvent {
  summary: string
  start: string
  end: string
  allDay: boolean
  calendar: string
}

export function useCalendar(days = 14) {
  return useQuery({
    queryKey: ['bff', 'calendar', days],
    queryFn: () => fetchBff<{ events: CalendarEvent[] }>(`/api/calendar?days=${days}`),
    staleTime: 15 * 60 * 1000,
  })
}

export interface VikunjaTask {
  id: number
  title: string
  due_date: string | null
  overdue: boolean
  priority: number
}

export function useVikunjaTasks() {
  return useQuery({
    queryKey: ['bff', 'tasks'],
    queryFn: () => fetchBff<{ tasks: VikunjaTask[] }>('/api/tasks'),
    staleTime: 2 * 60 * 1000,
  })
}

export interface ServiceLinks {
  homeAssistant: string
  paperless: string | null
  immich: string | null
  vikunja: string | null
  choreQuest: string
}

/** Öffentliche URLs der Hausdienste (z.B. https://immich.strau15.de) */
export function useLinks() {
  return useQuery({
    queryKey: ['bff', 'links'],
    queryFn: () => fetchBff<ServiceLinks>('/api/links'),
    staleTime: Infinity,
  })
}

export interface PaperlessDocument {
  id: number
  title: string
  created: string
}

export function useDocuments(limit = 5) {
  return useQuery({
    queryKey: ['bff', 'documents', limit],
    queryFn: () =>
      fetchBff<{ documents: PaperlessDocument[]; baseUrl: string }>(
        `/api/documents?limit=${limit}`
      ),
    staleTime: 5 * 60 * 1000,
  })
}
