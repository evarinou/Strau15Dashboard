// Sammelt die Datenbausteine für das KI-Briefing zu einem kompakten,
// kuratierten JSON — keine Rohdaten-Flut, damit der Prompt klein bleibt
// und das Modell nichts erfinden muss.

import { config } from '../config.js'
import type { HaConnection } from '../ha/connection.js'
import { fetchCalendarEvents } from '../routes/calendar.js'
import { fetchVikunjaTasks } from '../routes/tasks.js'

export interface BriefingData {
  zeitpunkt: string
  wetter: {
    zustand: string | null
    temperatur: number | null
  }
  anwesenheit: Record<string, string>
  lichterAn: number
  kalender: {
    vergangen24h: { titel: string; start: string }[]
    kommend7Tage: { titel: string; start: string }[]
  }
  choreQuest: {
    heuteOffen: string[]
    heuteErledigt: string[]
    wochenstand: { name: string; punkte: number }[]
  } | null
  vikunja: { titel: string; faelligkeit: string | null; ueberfaellig: boolean }[] | null
}

function iso(date: Date): string {
  return date.toISOString()
}

export async function collectBriefingData(ha: HaConnection): Promise<BriefingData> {
  const now = new Date()

  // --- HA-State-Cache (bereits im Prozess, kostenlos) ---
  const weather = ha.states.get('weather.forecast_home')
  const anwesenheit: Record<string, string> = {}
  for (const [id, entity] of ha.states) {
    if (id.startsWith('person.')) {
      const name = (entity.attributes.friendly_name as string) || id
      anwesenheit[name] = entity.state === 'home' ? 'zu Hause' : 'unterwegs'
    }
  }
  const lichterAn = [...ha.states.values()].filter(
    (e) => e.entity_id.startsWith('light.') && e.state === 'on'
  ).length

  // --- Kalender: −24h bis +7 Tage ---
  const kalender: BriefingData['kalender'] = { vergangen24h: [], kommend7Tage: [] }
  try {
    const from = new Date(now.getTime() - 24 * 3600 * 1000)
    const to = new Date(now.getTime() + 7 * 24 * 3600 * 1000)
    const events = await fetchCalendarEvents(from, to)
    for (const event of events) {
      const start = event.start
      const target = new Date(start) < now ? kalender.vergangen24h : kalender.kommend7Tage
      target.push({ titel: event.summary, start })
    }
  } catch {
    // Kalender nicht erreichbar → Abschnitt bleibt leer
  }

  // --- ChoreQuest: heutige Aufgaben + Wochen-Leaderboard ---
  let choreQuest: BriefingData['choreQuest'] = null
  try {
    const headers = {
      Authorization: `Bearer ${config.choreQuestToken}`,
      'Content-Type': 'application/json',
    }
    const [instancesRes, leaderboardRes] = await Promise.all([
      fetch(`${config.choreQuestUrl}/api/instances/today`, {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${config.choreQuestUrl}/api/leaderboard/weekly`, {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
    ])
    if (instancesRes.ok && leaderboardRes.ok) {
      const instances = (await instancesRes.json()) as {
        status: string
        task: { title: string }
      }[]
      const leaderboard = (await leaderboardRes.json()) as {
        display_name?: string
        username?: string
        weekly_points?: number
        points?: number
      }[]
      choreQuest = {
        heuteOffen: instances.filter((i) => i.status === 'pending').map((i) => i.task.title),
        heuteErledigt: instances.filter((i) => i.status === 'completed').map((i) => i.task.title),
        wochenstand: leaderboard.map((entry) => ({
          name: entry.display_name || entry.username || '?',
          punkte: entry.weekly_points ?? entry.points ?? 0,
        })),
      }
    }
  } catch {
    // ChoreQuest nicht erreichbar → Abschnitt entfällt
  }

  // --- Vikunja: offene Tasks im Projekt, überfällige zuerst ---
  let vikunja: BriefingData['vikunja'] = null
  try {
    const tasks = await fetchVikunjaTasks()
    vikunja = tasks.slice(0, 10).map((t) => ({
      titel: t.title,
      faelligkeit: t.due_date,
      ueberfaellig: t.overdue,
    }))
  } catch {
    // Vikunja deaktiviert/nicht erreichbar → Abschnitt entfällt
  }

  return {
    zeitpunkt: iso(now),
    wetter: {
      zustand: weather?.state ?? null,
      temperatur: (weather?.attributes.temperature as number | undefined) ?? null,
    },
    anwesenheit,
    lichterAn,
    kalender,
    choreQuest,
    vikunja,
  }
}
