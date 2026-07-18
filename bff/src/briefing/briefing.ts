// KI-Briefing: Generierung über die Anthropic-API, Cache mit Persistenz
// (/data/briefing.json — übersteht Watchtower-Restarts), feste Generierung
// 06:00/16:00 Europe/Berlin + stale-while-revalidate. /api/briefing liefert
// IMMER sofort — die Startseite darf nie wegen Anthropic langsam sein.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import type { HaConnection } from '../ha/connection.js'
import { collectBriefingData, type BriefingData } from './collect.js'

interface BriefingCacheEntry {
  text: string
  generatedAt: string
}

export interface BriefingResponse {
  text: string | null
  generatedAt: string | null
  stale: boolean
  fallback: boolean
  /** Rohbausteine für die Nicht-KI-Fassung, wenn kein Text verfügbar ist */
  data?: BriefingData
}

// Stabiler System-Prompt (Prompt-Caching-Prefix); Volatiles kommt in die User-Message.
const SYSTEM_PROMPT = `Du schreibst das tägliche Kurz-Briefing für das Zuhause von Eva-Maria und Lukas — ein Haus von 1842 in der Straubergasse. Ton: warm, knapp, editorial, wie eine gute Hauszeitung. Kein Tech-Jargon, keine Aufzählungszeichen, keine Emojis.

Struktur: zwei kurze Absätze, zusammen höchstens ~120 Wörter. Erst „Was war" (Rückblick auf die letzten 24 Stunden), dann „Was kommt" (die nächsten Tage). Ohne Überschriften — der Übergang ergibt sich im Text.

Priorisiere: Was heute oder morgen ansteht (Müllabfuhr! Termine! überfällige Aufgaben!) schlägt Statistik. Der Spielstand zwischen Eva-Maria und Lukas darf augenzwinkernd erwähnt werden, wenn er interessant ist. Erwähne NUR, was in den Daten steht — erfinde keine Termine, keine Ereignisse, kein Wetter. Wenn ein Datenbereich leer ist, lass ihn weg. Uhrzeiten im Format „14 Uhr", Daten als „am Dienstag" o.ä. relativ zum Zeitpunkt im JSON.`

export class BriefingService {
  private client: Anthropic | null
  private cache: BriefingCacheEntry | null = null
  private inFlight: Promise<void> | null = null
  private lastFailureAt = 0
  private timers: NodeJS.Timeout[] = []
  private readonly cachePath: string

  constructor(private readonly ha: HaConnection) {
    this.client = config.anthropicApiKey
      ? new Anthropic({ apiKey: config.anthropicApiKey })
      : null
    this.cachePath = join(config.dataDir, 'briefing.json')
  }

  get enabled(): boolean {
    return this.client !== null
  }

  async start(): Promise<void> {
    if (!this.enabled) return
    await this.loadPersisted()
    this.scheduleDaily(6, 0)
    this.scheduleDaily(16, 0)
  }

  stop(): void {
    for (const timer of this.timers) clearTimeout(timer)
  }

  /** Liefert sofort den Cache; generiert bei Bedarf im Hintergrund neu. */
  async get(): Promise<BriefingResponse> {
    if (!this.enabled) {
      return { text: null, generatedAt: null, stale: false, fallback: true }
    }

    const ttlMs = config.briefingTtlHours * 3600 * 1000
    const isStale =
      !this.cache || Date.now() - new Date(this.cache.generatedAt).getTime() > ttlMs

    if (isStale) this.refreshInBackground()

    if (this.cache) {
      return {
        text: this.cache.text,
        generatedAt: this.cache.generatedAt,
        stale: isStale,
        fallback: false,
      }
    }

    // Kein Cache vorhanden → strukturierte Rohbausteine für die Nicht-KI-Fassung
    const data = await collectBriefingData(this.ha).catch(() => undefined)
    return { text: null, generatedAt: null, stale: false, fallback: true, data }
  }

  private refreshInBackground(): void {
    if (this.inFlight) return
    // Backoff: nach Fehlschlag frühestens nach 15 min erneut
    if (Date.now() - this.lastFailureAt < 15 * 60 * 1000) return

    this.inFlight = this.generate()
      .catch((err) => {
        this.lastFailureAt = Date.now()
        console.error('[briefing] Generierung fehlgeschlagen:', err?.message ?? err)
      })
      .finally(() => {
        this.inFlight = null
      })
  }

  private async generate(): Promise<void> {
    if (!this.client) return
    const data = await collectBriefingData(this.ha)

    const response = await this.client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Hier die aktuellen Daten des Hauses als JSON. Schreibe daraus das Briefing.\n\n${JSON.stringify(data)}`,
        },
      ],
    })

    if (response.stop_reason === 'refusal') {
      throw new Error('Anthropic-Antwort wurde abgelehnt (refusal)')
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    if (!text) throw new Error('Leere Antwort von Anthropic')

    this.cache = { text, generatedAt: new Date().toISOString() }
    await this.persist()
    console.log('[briefing] Neu generiert')
  }

  private async loadPersisted(): Promise<void> {
    try {
      const raw = await readFile(this.cachePath, 'utf8')
      const parsed = JSON.parse(raw) as BriefingCacheEntry
      if (parsed.text && parsed.generatedAt) {
        this.cache = parsed
        console.log(`[briefing] Persistierter Stand geladen (${parsed.generatedAt})`)
      }
    } catch {
      // keine Persistenz vorhanden — normal beim ersten Start
    }
  }

  private async persist(): Promise<void> {
    try {
      await mkdir(config.dataDir, { recursive: true })
      await writeFile(this.cachePath, JSON.stringify(this.cache), 'utf8')
    } catch (err) {
      console.warn('[briefing] Persistenz nicht möglich (Volume fehlt?):', (err as Error).message)
    }
  }

  /** Feste Generierung um HH:MM in Europe/Berlin (Morgen-/Abend-Briefing). */
  private scheduleDaily(hour: number, minute: number): void {
    const next = nextOccurrence(hour, minute)
    const timer = setTimeout(() => {
      this.refreshInBackground()
      this.scheduleDaily(hour, minute)
    }, next.getTime() - Date.now())
    this.timers.push(timer)
  }
}

/** Nächstes Vorkommen von HH:MM in Europe/Berlin als Date. */
function nextOccurrence(hour: number, minute: number): Date {
  const formatter = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  // Minutenweise vorwärts suchen wäre teuer — stattdessen: Kandidat heute,
  // per Formatter prüfen, sonst +1 Tag. Wir approximieren über UTC-Offset.
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    for (const utcOffsetHours of [1, 2]) {
      const candidate = new Date()
      candidate.setUTCDate(candidate.getUTCDate() + dayOffset)
      candidate.setUTCHours(hour - utcOffsetHours, minute, 0, 0)
      if (candidate.getTime() <= Date.now()) continue
      const parts = formatter.format(candidate)
      const [h, m] = parts.split(':').map(Number)
      if (h === hour && m === minute) return candidate
    }
  }
  // Fallback: in 24h (sollte nie erreicht werden)
  return new Date(Date.now() + 24 * 3600 * 1000)
}
