// /api/photos — Immich „heute vor X Jahren". Der API-Key bleibt serverseitig;
// Thumbnails laufen als Byte-Proxy durch den BFF.

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

interface MemoryPhoto {
  id: string
  year: number
  takenAt: string
}

let memoryCache: { photos: MemoryPhoto[]; fetchedAt: number; day: string } | null = null
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

async function searchYear(
  yearsBack: number,
  now: Date,
  personIds: string[]
): Promise<MemoryPhoto[]> {
  const year = now.getFullYear() - yearsBack
  const dayStart = new Date(Date.UTC(year, now.getMonth(), now.getDate(), 0, 0, 0))
  const dayEnd = new Date(Date.UTC(year, now.getMonth(), now.getDate(), 23, 59, 59))

  const response = await fetch(`${config.immichUrl}/api/search/metadata`, {
    method: 'POST',
    headers: immichHeaders(),
    body: JSON.stringify({
      takenAfter: dayStart.toISOString(),
      takenBefore: dayEnd.toISOString(),
      size: 5,
      type: 'IMAGE',
      // Immich verknüpft mehrere personIds mit UND — ein Foto muss alle
      // genannten Personen zeigen. Für „Eva ODER Lukas" fragen wir daher
      // pro Person einzeln ab (siehe Aufrufer).
      ...(personIds.length > 0 ? { personIds } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Immich-Suche: ${response.status}`)

  const result = (await response.json()) as {
    assets?: { items?: { id: string; fileCreatedAt?: string; localDateTime?: string }[] }
  }
  return (result.assets?.items ?? []).map((asset) => ({
    id: asset.id,
    year,
    takenAt: asset.localDateTime ?? asset.fileCreatedAt ?? dayStart.toISOString(),
  }))
}

export function registerPhotoRoutes(app: FastifyInstance): void {
  app.get('/api/photos/today', async (request, reply) => {
    if (!immichEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const now = new Date()
    const day = now.toISOString().slice(0, 10)
    // 1h-Cache — die „heute vor X Jahren"-Liste ändert sich untertägig nicht
    if (memoryCache && memoryCache.day === day && Date.now() - memoryCache.fetchedAt < 3600_000) {
      reply.header('cache-control', 'private, max-age=3600')
      return { photos: memoryCache.photos }
    }

    try {
      const personIds = await resolvePersonIds()
      const years = Array.from({ length: 15 }, (_, i) => i + 1)

      // Ohne Filter: eine Abfrage pro Jahr. Mit Filter: pro Jahr und Person
      // eine Abfrage, damit „Eva ODER Lukas" gilt (Immich verknüpft mehrere
      // personIds sonst mit UND).
      const queries =
        personIds.length > 0
          ? years.flatMap((y) => personIds.map((id) => searchYear(y, now, [id])))
          : years.map((y) => searchYear(y, now, []))

      const results = await Promise.allSettled(queries)
      const seen = new Set<string>()
      const photos = results
        .filter((r): r is PromiseFulfilledResult<MemoryPhoto[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)
        // Ein Foto mit beiden Personen käme sonst doppelt
        .filter((photo) => (seen.has(photo.id) ? false : seen.add(photo.id)))
        .sort((a, b) => b.year - a.year)

      memoryCache = { photos, fetchedAt: Date.now(), day }
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
