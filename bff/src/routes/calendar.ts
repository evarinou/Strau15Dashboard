// /api/calendar — Kalender-Events über die HA-REST-API (Müllabfuhr + optional
// weitere Kalender via CALENDAR_ENTITIES), gemerged und sortiert.

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

interface HaCalendarEvent {
  summary: string
  description?: string | null
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
}

export interface CalendarEvent {
  summary: string
  start: string
  end: string
  allDay: boolean
  calendar: string
}

function calendarEntities(): string[] {
  const extra = process.env.CALENDAR_ENTITIES?.split(',').map((s) => s.trim()).filter(Boolean)
  return extra?.length ? extra : ['calendar.landkreis_kronach']
}

export async function fetchCalendarEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
  const params = `start=${encodeURIComponent(from.toISOString())}&end=${encodeURIComponent(to.toISOString())}`
  const results = await Promise.allSettled(
    calendarEntities().map(async (entity) => {
      const response = await fetch(`${config.haUrl}/api/calendars/${entity}?${params}`, {
        headers: { Authorization: `Bearer ${config.haToken}` },
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) throw new Error(`HA-Kalender ${entity}: ${response.status}`)
      const events = (await response.json()) as HaCalendarEvent[]
      return events.map((event) => ({
        summary: event.summary,
        start: event.start.dateTime ?? event.start.date ?? '',
        end: event.end.dateTime ?? event.end.date ?? '',
        allDay: Boolean(event.start.date),
        calendar: entity,
      }))
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<CalendarEvent[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function registerCalendarRoutes(app: FastifyInstance): void {
  app.get('/api/calendar', async (request, reply) => {
    const days = Math.min(Number((request.query as { days?: string }).days ?? 14), 60)
    const now = new Date()
    const to = new Date(now.getTime() + days * 24 * 3600 * 1000)

    try {
      const events = await fetchCalendarEvents(now, to)
      reply.header('cache-control', 'private, max-age=300')
      return { events }
    } catch (err) {
      request.log.warn({ err }, 'Kalender nicht erreichbar')
      reply.status(502)
      return { error: 'Kalender nicht erreichbar' }
    }
  })
}
