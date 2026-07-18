// /api/documents — letzte Paperless-Dokumente, read-only.
// Token bleibt serverseitig; Thumbnails als Byte-Proxy.

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

function paperlessEnabled(): boolean {
  return Boolean(config.paperlessUrl && config.paperlessToken)
}

function headers(): Record<string, string> {
  return { Authorization: `Token ${config.paperlessToken}` }
}

export function registerDocumentRoutes(app: FastifyInstance): void {
  app.get('/api/documents', async (request, reply) => {
    if (!paperlessEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const limit = Math.min(Number((request.query as { limit?: string }).limit ?? 5), 20)
    try {
      const response = await fetch(
        `${config.paperlessUrl}/api/documents/?ordering=-created&page_size=${limit}`,
        { headers: headers(), signal: AbortSignal.timeout(10_000) }
      )
      if (!response.ok) throw new Error(`Paperless: ${response.status}`)

      const data = (await response.json()) as {
        results: { id: number; title: string; created: string; correspondent?: number | null }[]
      }
      reply.header('cache-control', 'private, max-age=300')
      return {
        documents: data.results.map((doc) => ({
          id: doc.id,
          title: doc.title,
          created: doc.created,
        })),
        // Link-Basis für „in Paperless öffnen" (read-only Verweis, kein Token)
        baseUrl: config.paperlessUrl,
      }
    } catch (err) {
      request.log.warn({ err }, 'Paperless nicht erreichbar')
      reply.status(502)
      return { error: 'Paperless nicht erreichbar' }
    }
  })

  app.get('/api/documents/:id/thumb', async (request, reply) => {
    if (!paperlessEnabled()) {
      reply.status(503)
      return { disabled: true }
    }

    const { id } = request.params as { id: string }
    if (!/^\d+$/.test(id)) {
      reply.status(400)
      return { error: 'Ungültige Dokument-ID' }
    }

    try {
      const response = await fetch(`${config.paperlessUrl}/api/documents/${id}/thumb/`, {
        headers: headers(),
        signal: AbortSignal.timeout(15_000),
      })
      reply.status(response.status)
      reply.header('content-type', response.headers.get('content-type') ?? 'image/webp')
      reply.header('cache-control', 'private, max-age=86400')
      return reply.send(Buffer.from(await response.arrayBuffer()))
    } catch (err) {
      request.log.warn({ err }, 'Paperless-Thumbnail fehlgeschlagen')
      reply.status(502)
      return { error: 'Paperless nicht erreichbar' }
    }
  })
}
