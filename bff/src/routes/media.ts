// /api/media — Medien-Kommandozentrum (Phase 3): Jellyfin, Sonarr/Radarr, Seerr
// als eine Ansicht. Alle Keys bleiben serverseitig; Poster laufen als
// Byte-Proxy durch den BFF. Jeder Dienst deaktiviert sich einzeln, wenn seine
// Env-Vars fehlen (503 {disabled:true}).

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

interface MediaItem {
  id: string
  type: 'movie' | 'episode' | 'series'
  title: string
  subtitle: string | null
  /** 0–100, nur bei „Weiterschauen" */
  progress: number | null
  /** ISO-Datum, nur bei „zuletzt hinzugefügt" */
  addedAt: string | null
  /** Fertiger BFF-Proxy-Pfad oder null (Frontend zeigt dann einen Platzhalter) */
  image: string | null
}

// ---------------------------------------------------------------------------
// Jellyfin — „Was schauen wir?"
// ---------------------------------------------------------------------------

function jellyfinEnabled(): boolean {
  return Boolean(config.jellyfinUrl && config.jellyfinApiKey)
}

function jellyfinHeaders(): Record<string, string> {
  return { Authorization: `MediaBrowser Token="${config.jellyfinApiKey!}"` }
}

/** Aufgelöste UserId des Haushalts-Accounts (null = noch nicht aufgelöst) */
let jellyfinUserIdCache: string | null = null

interface JellyfinUser {
  Id: string
  Name: string
}

/**
 * Löst den Jellyfin-User auf: JELLYFIN_USER (Name) falls gesetzt, sonst der
 * erste User des Servers. Bei mehreren Usern ohne Konfiguration wird gewarnt
 * statt geraten zu schweigen — Continue Watching wäre sonst stumm die falsche
 * Liste.
 */
async function resolveJellyfinUserId(): Promise<string> {
  if (jellyfinUserIdCache) return jellyfinUserIdCache

  const response = await fetch(`${config.jellyfinUrl}/Users`, {
    headers: jellyfinHeaders(),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Jellyfin-Users: ${response.status}`)
  const users = (await response.json()) as JellyfinUser[]
  if (users.length === 0) throw new Error('Jellyfin: keine User vorhanden')

  const wanted = config.jellyfinUser?.toLowerCase()
  const match = wanted
    ? users.find((user) => user.Name.toLowerCase() === wanted)
    : users[0]
  if (!match) {
    throw new Error(
      `Jellyfin: kein User namens ${config.jellyfinUser}. Bekannte User: ${users.map((u) => u.Name).join(', ')}`
    )
  }
  if (!wanted && users.length > 1) {
    console.warn(
      `[media] Jellyfin hat ${users.length} User — verwende "${match.Name}". ` +
        `Mit JELLYFIN_USER gezielt wählen (bekannt: ${users.map((u) => u.Name).join(', ')})`
    )
  }

  jellyfinUserIdCache = match.Id
  return jellyfinUserIdCache
}

interface JellyfinItem {
  Id: string
  Name: string
  Type: 'Movie' | 'Episode' | 'Series' | string
  ProductionYear?: number
  DateCreated?: string
  SeriesId?: string
  SeriesName?: string
  SeriesPrimaryImageTag?: string
  ParentIndexNumber?: number
  IndexNumber?: number
  ImageTags?: { Primary?: string }
  UserData?: { PlayedPercentage?: number }
}

/**
 * Bildwahl: Episoden bekommen das Serien-Poster (Episoden-Thumbs sind 16:9
 * und spoilern), alles andere sein eigenes Primary-Bild. Ohne ImageTag null —
 * nie eine URL raten, die dann als kaputte Kachel endet.
 */
function jellyfinImage(item: JellyfinItem): string | null {
  if (item.Type === 'Episode' && item.SeriesId && item.SeriesPrimaryImageTag) {
    return `/api/media/image/jellyfin/${item.SeriesId}?tag=${item.SeriesPrimaryImageTag}`
  }
  if (item.ImageTags?.Primary) {
    return `/api/media/image/jellyfin/${item.Id}?tag=${item.ImageTags.Primary}`
  }
  return null
}

function toMediaItem(item: JellyfinItem, kind: 'watching' | 'latest'): MediaItem {
  const isEpisode = item.Type === 'Episode'
  const episodeLabel =
    item.ParentIndexNumber != null && item.IndexNumber != null
      ? `S${item.ParentIndexNumber} · E${item.IndexNumber} — ${item.Name}`
      : item.Name
  return {
    id: item.Id,
    type: isEpisode ? 'episode' : item.Type === 'Series' ? 'series' : 'movie',
    title: isEpisode ? (item.SeriesName ?? item.Name) : item.Name,
    subtitle: isEpisode ? episodeLabel : (item.ProductionYear?.toString() ?? null),
    progress:
      kind === 'watching' && item.UserData?.PlayedPercentage != null
        ? Math.round(item.UserData.PlayedPercentage)
        : null,
    addedAt: kind === 'latest' ? (item.DateCreated ?? null) : null,
    image: jellyfinImage(item),
  }
}

async function fetchJellyfin(path: string): Promise<JellyfinItem[]> {
  const response = await fetch(`${config.jellyfinUrl}${path}`, {
    headers: jellyfinHeaders(),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Jellyfin ${path}: ${response.status}`)
  // /UserItems/Resume liefert { Items: [...] }, /Items/Latest ein nacktes Array
  const result = (await response.json()) as JellyfinItem[] | { Items?: JellyfinItem[] }
  return Array.isArray(result) ? result : (result.Items ?? [])
}

// ---------------------------------------------------------------------------
// Sonarr/Radarr — „Was kommt?"
// ---------------------------------------------------------------------------

function sonarrEnabled(): boolean {
  return Boolean(config.sonarrUrl && config.sonarrApiKey)
}

function radarrEnabled(): boolean {
  return Boolean(config.radarrUrl && config.radarrApiKey)
}

interface UpcomingItem {
  source: 'sonarr' | 'radarr'
  /** seriesId bzw. movieId — Schlüssel für den Poster-Proxy */
  id: number
  title: string
  subtitle: string | null
  date: string
  hasFile: boolean
  image: string
}

interface SonarrEpisode {
  title: string
  seriesId: number
  seasonNumber: number
  episodeNumber: number
  airDateUtc?: string
  hasFile: boolean
  series?: { title?: string }
}

async function fetchSonarrUpcoming(start: string, end: string): Promise<UpcomingItem[]> {
  const response = await fetch(
    `${config.sonarrUrl}/api/v3/calendar?start=${start}&end=${end}&includeSeries=true`,
    { headers: { 'X-Api-Key': config.sonarrApiKey! }, signal: AbortSignal.timeout(10_000) }
  )
  if (!response.ok) throw new Error(`Sonarr-Kalender: ${response.status}`)
  const episodes = (await response.json()) as SonarrEpisode[]
  return episodes
    .filter((episode) => episode.airDateUtc)
    .map((episode) => ({
      source: 'sonarr' as const,
      id: episode.seriesId,
      title: episode.series?.title ?? episode.title,
      subtitle:
        `S${episode.seasonNumber} · E${episode.episodeNumber}` +
        (episode.title && episode.title !== 'TBA' ? ` — ${episode.title}` : ''),
      date: episode.airDateUtc!,
      hasFile: episode.hasFile,
      image: `/api/media/poster/sonarr/${episode.seriesId}`,
    }))
}

interface RadarrMovie {
  id: number
  title: string
  inCinemas?: string
  digitalRelease?: string
  physicalRelease?: string
  hasFile: boolean
}

/**
 * Ein Film kann mehrere Release-Termine haben (Kino/Digital/Disc). Gezeigt
 * wird der nächste, der ins Fenster fällt — Radarr liefert den Film ja genau
 * deshalb im Kalender. Ohne Termin im Fenster wird der Eintrag verworfen.
 */
function nextRadarrRelease(
  movie: RadarrMovie,
  start: string,
  end: string
): { date: string; label: string } | null {
  const candidates = [
    { date: movie.inCinemas, label: 'Kino' },
    { date: movie.digitalRelease, label: 'Digital' },
    { date: movie.physicalRelease, label: 'Disc' },
  ]
    .filter((c): c is { date: string; label: string } => Boolean(c.date))
    .filter((c) => c.date >= start && c.date <= `${end}T23:59:59Z`)
    .sort((a, b) => a.date.localeCompare(b.date))
  return candidates[0] ?? null
}

async function fetchRadarrUpcoming(start: string, end: string): Promise<UpcomingItem[]> {
  const response = await fetch(
    `${config.radarrUrl}/api/v3/calendar?start=${start}&end=${end}`,
    { headers: { 'X-Api-Key': config.radarrApiKey! }, signal: AbortSignal.timeout(10_000) }
  )
  if (!response.ok) throw new Error(`Radarr-Kalender: ${response.status}`)
  const movies = (await response.json()) as RadarrMovie[]
  return movies.flatMap((movie) => {
    const release = nextRadarrRelease(movie, start, end)
    if (!release) return []
    return [
      {
        source: 'radarr' as const,
        id: movie.id,
        title: movie.title,
        subtitle: release.label,
        date: release.date,
        hasFile: movie.hasFile,
        image: `/api/media/poster/radarr/${movie.id}`,
      },
    ]
  })
}

/** Byte-Proxy für Sonarr/Radarr-Poster — gleiche Form wie der Jellyfin-Proxy. */
function registerPosterProxy(
  app: FastifyInstance,
  source: 'sonarr' | 'radarr',
  enabled: () => boolean,
  baseUrl: () => string,
  apiKey: () => string
): void {
  app.get(`/api/media/poster/${source}/:id`, async (request, reply) => {
    if (!enabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const { id } = request.params as { id: string }
    if (!/^\d+$/.test(id)) {
      reply.status(400)
      return { error: 'Ungültige Poster-ID' }
    }

    try {
      const response = await fetch(`${baseUrl()}/api/v3/mediacover/${id}/poster-250.jpg`, {
        headers: { 'X-Api-Key': apiKey() },
        signal: AbortSignal.timeout(15_000),
      })
      reply.status(response.status)
      reply.header('content-type', response.headers.get('content-type') ?? 'image/jpeg')
      reply.header('cache-control', 'private, max-age=86400')
      return reply.send(Buffer.from(await response.arrayBuffer()))
    } catch (err) {
      request.log.warn({ err }, `${source}-Poster fehlgeschlagen`)
      reply.status(502)
      return { error: `${source} nicht erreichbar` }
    }
  })
}

// ---------------------------------------------------------------------------
// Seerr — „Wunsch äußern" (Suche + Request, die einzige schreibende Aktion)
// ---------------------------------------------------------------------------

function seerrEnabled(): boolean {
  return Boolean(config.seerrUrl && config.seerrApiKey)
}

function seerrHeaders(): Record<string, string> {
  return { 'X-Api-Key': config.seerrApiKey!, 'Content-Type': 'application/json' }
}

interface SeerrResult {
  id: number
  mediaType: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  releaseDate?: string
  firstAirDate?: string
  overview?: string
  posterPath?: string
  mediaInfo?: { status?: number }
}

/** Overseerr-MediaStatus (1–5) → sprechender Status für die Karte */
const SEERR_STATUS: Record<number, string> = {
  2: 'pending',
  3: 'processing',
  4: 'partial',
  5: 'available',
}

function toSearchResult(result: SeerrResult) {
  const date = result.releaseDate ?? result.firstAirDate
  return {
    id: result.id,
    mediaType: result.mediaType as 'movie' | 'tv',
    title: result.title ?? result.name ?? '?',
    year: date ? date.slice(0, 4) : null,
    overview: result.overview ?? '',
    status: SEERR_STATUS[result.mediaInfo?.status ?? 0] ?? 'none',
    image: result.posterPath
      ? `/api/media/poster/tmdb?path=${encodeURIComponent(result.posterPath)}`
      : null,
  }
}

// ---------------------------------------------------------------------------
// Routen
// ---------------------------------------------------------------------------

export function registerMediaRoutes(app: FastifyInstance): void {
  // Welche Bereiche der Medien-Seite serverseitig konfiguriert sind —
  // die Karten blenden sich damit aus, ohne erst ins Leere zu fetchen.
  app.get('/api/media/status', async (_request, reply) => {
    reply.header('cache-control', 'private, max-age=300')
    return {
      watching: jellyfinEnabled(),
      upcoming: sonarrEnabled() || radarrEnabled(),
      wish: seerrEnabled(),
    }
  })

  app.get('/api/media/continue', async (request, reply) => {
    if (!jellyfinEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    try {
      const userId = await resolveJellyfinUserId()
      const [watching, latest] = await Promise.all([
        fetchJellyfin(
          `/UserItems/Resume?userId=${userId}&limit=8&mediaTypes=Video&fields=SeriesPrimaryImageTag`
        ),
        fetchJellyfin(
          `/Items/Latest?userId=${userId}&limit=8&fields=DateCreated,SeriesPrimaryImageTag`
        ),
      ])
      reply.header('cache-control', 'private, max-age=120')
      return {
        watching: watching.map((item) => toMediaItem(item, 'watching')),
        latest: latest.map((item) => toMediaItem(item, 'latest')),
      }
    } catch (err) {
      // Gecachte UserId könnte veraltet sein (User gelöscht) — neu auflösen lassen
      jellyfinUserIdCache = null
      request.log.warn({ err }, 'Jellyfin nicht erreichbar')
      reply.status(502)
      return { error: 'Jellyfin nicht erreichbar' }
    }
  })

  app.get('/api/media/upcoming', async (request, reply) => {
    // Der Bereich ist aktiv, sobald EINER der beiden Dienste konfiguriert ist
    if (!sonarrEnabled() && !radarrEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const days = Math.min(Number((request.query as { days?: string }).days ?? 14), 60)
    const start = new Date().toISOString().slice(0, 10)
    const end = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10)

    const results = await Promise.allSettled([
      sonarrEnabled() ? fetchSonarrUpcoming(start, end) : Promise.resolve([]),
      radarrEnabled() ? fetchRadarrUpcoming(start, end) : Promise.resolve([]),
    ])
    const [sonarrResult, radarrResult] = results
    for (const result of results) {
      if (result.status === 'rejected') {
        request.log.warn({ err: result.reason }, 'Medien-Kalender teilweise nicht erreichbar')
      }
    }

    // Beide konfigurierten Quellen down → 502; eine down → Rest liefern und
    // im sources-Objekt kenntlich machen (die Karte kann das anmerken).
    const items = results
      .filter((r): r is PromiseFulfilledResult<UpcomingItem[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .sort((a, b) => a.date.localeCompare(b.date))
    const sources = {
      sonarr: sonarrEnabled() && sonarrResult.status === 'fulfilled',
      radarr: radarrEnabled() && radarrResult.status === 'fulfilled',
    }
    if (!sources.sonarr && !sources.radarr) {
      reply.status(502)
      return { error: 'Sonarr/Radarr nicht erreichbar' }
    }

    reply.header('cache-control', 'private, max-age=300')
    return { items, sources }
  })

  registerPosterProxy(app, 'sonarr', sonarrEnabled, () => config.sonarrUrl!, () => config.sonarrApiKey!)
  registerPosterProxy(app, 'radarr', radarrEnabled, () => config.radarrUrl!, () => config.radarrApiKey!)

  app.get('/api/media/search', async (request, reply) => {
    if (!seerrEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const query = ((request.query as { query?: string }).query ?? '').trim()
    if (query.length < 2) {
      reply.status(400)
      return { error: 'Suchbegriff zu kurz (min. 2 Zeichen)' }
    }

    try {
      const response = await fetch(
        `${config.seerrUrl}/api/v1/search?query=${encodeURIComponent(query)}&page=1`,
        { headers: seerrHeaders(), signal: AbortSignal.timeout(10_000) }
      )
      if (!response.ok) throw new Error(`Seerr-Suche: ${response.status}`)
      const result = (await response.json()) as { results?: SeerrResult[] }
      reply.header('cache-control', 'no-store')
      return {
        results: (result.results ?? [])
          .filter((entry) => entry.mediaType === 'movie' || entry.mediaType === 'tv')
          .slice(0, 20)
          .map(toSearchResult),
      }
    } catch (err) {
      request.log.warn({ err }, 'Seerr nicht erreichbar')
      reply.status(502)
      return { error: 'Seerr nicht erreichbar' }
    }
  })

  app.post('/api/media/request', async (request, reply) => {
    if (!seerrEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const body = request.body as { mediaType?: unknown; mediaId?: unknown }
    const mediaType = body?.mediaType
    const mediaId = body?.mediaId
    if (
      (mediaType !== 'movie' && mediaType !== 'tv') ||
      typeof mediaId !== 'number' ||
      !Number.isInteger(mediaId) ||
      mediaId <= 0
    ) {
      reply.status(400)
      return { error: 'Ungültige Anfrage (mediaType movie|tv, mediaId nötig)' }
    }

    try {
      const response = await fetch(`${config.seerrUrl}/api/v1/request`, {
        method: 'POST',
        headers: seerrHeaders(),
        // Bei Serien immer alle Staffeln — das Dashboard soll einfach bleiben;
        // Feinauswahl macht man direkt in Seerr.
        body: JSON.stringify({
          mediaType,
          mediaId,
          ...(mediaType === 'tv' ? { seasons: 'all' } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as {
          message?: string
        } | null
        // Upstream-Klartext (z.B. "bereits angefragt") durchreichen; nur
        // 5xx wird zum generischen 502.
        reply.status(response.status < 500 ? response.status : 502)
        return { error: detail?.message ?? 'Seerr-Anfrage fehlgeschlagen' }
      }

      const created = (await response.json()) as { id?: number; status?: number }
      reply.status(201)
      return { ok: true, requestId: created.id ?? null }
    } catch (err) {
      request.log.warn({ err }, 'Seerr nicht erreichbar')
      reply.status(502)
      return { error: 'Seerr nicht erreichbar' }
    }
  })

  app.get('/api/media/poster/tmdb', async (request, reply) => {
    if (!seerrEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const { path } = request.query as { path?: string }
    if (!path || !/^\/[A-Za-z0-9]+\.(jpg|png)$/.test(path)) {
      reply.status(400)
      return { error: 'Ungültiger Poster-Pfad' }
    }

    try {
      const response = await fetch(`https://image.tmdb.org/t/p/w342${path}`, {
        signal: AbortSignal.timeout(15_000),
      })
      reply.status(response.status)
      reply.header('content-type', response.headers.get('content-type') ?? 'image/jpeg')
      reply.header('cache-control', 'private, max-age=86400')
      return reply.send(Buffer.from(await response.arrayBuffer()))
    } catch (err) {
      request.log.warn({ err }, 'TMDB-Poster fehlgeschlagen')
      reply.status(502)
      return { error: 'TMDB nicht erreichbar' }
    }
  })

  app.get('/api/media/image/jellyfin/:id', async (request, reply) => {
    if (!jellyfinEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const { id } = request.params as { id: string }
    const { tag } = request.query as { tag?: string }
    if (!/^[a-f0-9]{32}$/.test(id) || (tag && !/^[a-zA-Z0-9]+$/.test(tag))) {
      reply.status(400)
      return { error: 'Ungültige Bild-ID' }
    }

    try {
      const tagParam = tag ? `&tag=${tag}` : ''
      const response = await fetch(
        `${config.jellyfinUrl}/Items/${id}/Images/Primary?fillHeight=450&quality=90${tagParam}`,
        { headers: jellyfinHeaders(), signal: AbortSignal.timeout(15_000) }
      )
      reply.status(response.status)
      reply.header('content-type', response.headers.get('content-type') ?? 'image/jpeg')
      reply.header('cache-control', 'private, max-age=86400')
      return reply.send(Buffer.from(await response.arrayBuffer()))
    } catch (err) {
      request.log.warn({ err }, 'Jellyfin-Bild fehlgeschlagen')
      reply.status(502)
      return { error: 'Jellyfin nicht erreichbar' }
    }
  })
}
