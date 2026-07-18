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

function immichEnabled(): boolean {
  return Boolean(config.immichUrl && config.immichApiKey)
}

async function searchYear(yearsBack: number, now: Date): Promise<MemoryPhoto[]> {
  const year = now.getFullYear() - yearsBack
  const dayStart = new Date(Date.UTC(year, now.getMonth(), now.getDate(), 0, 0, 0))
  const dayEnd = new Date(Date.UTC(year, now.getMonth(), now.getDate(), 23, 59, 59))

  const response = await fetch(`${config.immichUrl}/api/search/metadata`, {
    method: 'POST',
    headers: {
      'x-api-key': config.immichApiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      takenAfter: dayStart.toISOString(),
      takenBefore: dayEnd.toISOString(),
      size: 5,
      type: 'IMAGE',
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
      const years = Array.from({ length: 15 }, (_, i) => i + 1)
      const results = await Promise.allSettled(years.map((y) => searchYear(y, now)))
      const photos = results
        .filter((r): r is PromiseFulfilledResult<MemoryPhoto[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)
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
