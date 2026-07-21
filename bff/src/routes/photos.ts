// /api/photos — zufällige Immich-Fotos, auf denen ALLE in IMMICH_PEOPLE
// genannten Personen gemeinsam zu sehen sind (Immich verknüpft mehrere
// personIds mit UND). Der API-Key bleibt serverseitig; Thumbnails laufen
// als Byte-Proxy durch den BFF.

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

interface MemoryPhoto {
  id: string
  takenAt: string
}

// Die Zufallsauswahl rotiert nicht bei jedem Request — sonst würde die
// Karte bei jedem Refetch neu durchmischen. Sie bleibt für PHOTO_TTL_MS
// stabil und wird danach neu gewürfelt.
const PHOTO_TTL_MS = 6 * 3600_000
let photoCache: { photos: MemoryPhoto[]; fetchedAt: number } | null = null
/** Aufgelöste Personen-IDs aus IMMICH_PEOPLE (null = noch nicht aufgelöst) */
let personIdCache: string[] | null = null

function immichEnabled(): boolean {
  return Boolean(config.immichUrl && config.immichApiKey)
}

function immichHeaders(): Record<string, string> {
  return { 'x-api-key': config.immichApiKey!, 'Content-Type': 'application/json' }
}

interface ImmichPerson {
  id: string
  name: string
  thumbnailPath?: string
}

async function fetchPeople(): Promise<ImmichPerson[]> {
  // size=1000 ist das Maximum der Immich-API; darüber hinaus paginieren wir,
  // damit ein Name nicht nur deshalb „nicht gefunden" wird, weil er auf
  // Seite 2 steht.
  const people: ImmichPerson[] = []
  for (let page = 1; page <= 10; page++) {
    const response = await fetch(
      `${config.immichUrl}/api/people?withHidden=false&size=1000&page=${page}`,
      { headers: immichHeaders(), signal: AbortSignal.timeout(10_000) }
    )
    if (!response.ok) throw new Error(`Immich-Personen: ${response.status}`)
    const result = (await response.json()) as {
      people?: ImmichPerson[]
      hasNextPage?: boolean
    }
    people.push(...(result.people ?? []))
    if (!result.hasNextPage) break
  }
  return people
}

/**
 * Löst die in IMMICH_PEOPLE konfigurierten Namen zu Immich-Personen-IDs auf.
 * Leere Konfiguration → [] (kein Filter). Namen, die Immich nicht kennt,
 * werden geloggt statt zu blockieren — sonst verschwände der Foto-Block
 * stillschweigend, nur weil ein Name anders geschrieben ist.
 */
async function resolvePersonIds(): Promise<string[]> {
  if (personIdCache !== null) return personIdCache
  if (config.immichPeople.length === 0) {
    personIdCache = []
    return personIdCache
  }

  const people = await fetchPeople()
  const wanted = config.immichPeople.map((name) => name.toLowerCase())
  const matched = people.filter((person) => wanted.includes(person.name.toLowerCase()))

  const missing = config.immichPeople.filter(
    (name) => !matched.some((person) => person.name.toLowerCase() === name.toLowerCase())
  )
  if (missing.length > 0) {
    console.warn(
      `[photos] IMMICH_PEOPLE: keine Immich-Person namens ${missing.join(', ')} gefunden. ` +
        `Bekannte Namen: ${people.map((p) => p.name).filter(Boolean).join(', ') || '(keine benannten Personen)'}`
    )
  }

  personIdCache = matched.map((person) => person.id)
  if (personIdCache.length > 0) {
    console.log(`[photos] Personen-Filter aktiv: ${matched.map((p) => p.name).join(', ')}`)
  }
  return personIdCache
}

interface ImmichAsset {
  id: string
  fileCreatedAt?: string
  localDateTime?: string
}

function toPhotos(items: ImmichAsset[]): MemoryPhoto[] {
  return items.map((asset) => ({
    id: asset.id,
    takenAt: asset.localDateTime ?? asset.fileCreatedAt ?? new Date().toISOString(),
  }))
}

/**
 * Zufällige Fotos, auf denen alle übergebenen Personen gemeinsam zu sehen
 * sind. Immich verknüpft mehrere personIds mit UND — genau das wollen wir
 * hier („Lukas UND Eva-Maria").
 *
 * Bevorzugt `/api/search/random` (echte Zufallsauswahl über die ganze
 * Mediathek). Ältere Immich-Versionen kennen den Endpoint nicht — dann
 * fällt es auf die Metadaten-Suche zurück und mischt selbst durch, damit
 * die Karte trotzdem etwas zeigt statt leer zu bleiben.
 */
async function searchRandom(personIds: string[], size: number): Promise<MemoryPhoto[]> {
  const person = personIds.length > 0 ? { personIds } : {}

  try {
    const response = await fetch(`${config.immichUrl}/api/search/random`, {
      method: 'POST',
      headers: immichHeaders(),
      body: JSON.stringify({ size, type: 'IMAGE', ...person }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`Immich-Zufallssuche: ${response.status}`)

    const result = (await response.json()) as
      | ImmichAsset[]
      | { assets?: { items?: ImmichAsset[] } }
    const items = Array.isArray(result) ? result : (result.assets?.items ?? [])
    if (items.length > 0) return toPhotos(items)
    // Leeres Ergebnis: unten regulär über die Metadaten-Suche versuchen
  } catch (err) {
    console.warn('[photos] /search/random nicht verfügbar, nutze Metadaten-Suche', err)
  }

  // Fallback: die Metadaten-Suche gibt es in jeder Immich-Version. Sie
  // liefert neueste zuerst; wir holen eine größere Seite und mischen selbst.
  const response = await fetch(`${config.immichUrl}/api/search/metadata`, {
    method: 'POST',
    headers: immichHeaders(),
    body: JSON.stringify({ size: 250, type: 'IMAGE', ...person }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Immich-Suche: ${response.status}`)
  const result = (await response.json()) as {
    assets?: { items?: ImmichAsset[] }
  }
  const items = result.assets?.items ?? []
  // Fisher-Yates auf einer Kopie, dann zuschneiden
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return toPhotos(items.slice(0, size))
}

export function registerPhotoRoutes(app: FastifyInstance): void {
  app.get('/api/photos/today', async (request, reply) => {
    if (!immichEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    if (photoCache && Date.now() - photoCache.fetchedAt < PHOTO_TTL_MS) {
      reply.header('cache-control', 'private, max-age=3600')
      return { photos: photoCache.photos }
    }

    try {
      const personIds = await resolvePersonIds()
      // Alle konfigurierten Personen in EINER Abfrage → Immich verlangt,
      // dass jedes Foto sie alle zeigt. Etwas Überhang holen, damit die
      // Karte auswählen kann; die Frontend-Auswahl schneidet zu.
      const photos = await searchRandom(personIds, 12)

      photoCache = { photos, fetchedAt: Date.now() }
      reply.header('cache-control', 'private, max-age=3600')
      return { photos }
    } catch (err) {
      request.log.warn({ err }, 'Immich nicht erreichbar')
      reply.status(502)
      return { error: 'Immich nicht erreichbar' }
    }
  })

  // Hilfs-Endpoint zum Konfigurieren: zeigt die von Immich erkannten,
  // benannten Personen und ob sie aktuell für IMMICH_PEOPLE greifen.
  app.get('/api/photos/people', async (request, reply) => {
    if (!immichEnabled()) {
      reply.status(503)
      return { disabled: true }
    }
    try {
      const people = await fetchPeople()
      const configured = config.immichPeople.map((n) => n.toLowerCase())
      return {
        configured: config.immichPeople,
        people: people
          .filter((person) => person.name)
          .map((person) => ({
            name: person.name,
            aktiv: configured.includes(person.name.toLowerCase()),
          })),
      }
    } catch (err) {
      request.log.warn({ err }, 'Immich-Personen nicht abrufbar')
      reply.status(502)
      return { error: 'Immich nicht erreichbar' }
    }
  })

  app.get('/api/photos/:id/thumbnail', async (request, reply) => {
    if (!immichEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const { id } = request.params as { id: string }
    if (!/^[a-zA-Z0-9-]+$/.test(id)) {
      reply.status(400)
      return { error: 'Ungültige Asset-ID' }
    }

    try {
      const response = await fetch(
        `${config.immichUrl}/api/assets/${id}/thumbnail?size=preview`,
        {
          headers: { 'x-api-key': config.immichApiKey! },
          signal: AbortSignal.timeout(15_000),
        }
      )
      reply.status(response.status)
      reply.header('content-type', response.headers.get('content-type') ?? 'image/jpeg')
      reply.header('cache-control', 'private, max-age=86400')
      return reply.send(Buffer.from(await response.arrayBuffer()))
    } catch (err) {
      request.log.warn({ err }, 'Immich-Thumbnail fehlgeschlagen')
      reply.status(502)
      return { error: 'Immich nicht erreichbar' }
    }
  })
}
