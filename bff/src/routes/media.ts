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
// Routen
// ---------------------------------------------------------------------------

export function registerMediaRoutes(app: FastifyInstance): void {
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
