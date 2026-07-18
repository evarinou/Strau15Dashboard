// Read-only-Proxy für HA-Bild-Endpunkte (Album-Art, Personen-Avatare,
// Drucker-Kamera). Nur GET, nur Pfad-Allowlist; der HA-Token bleibt serverseitig.
// Nötig, weil entity_picture-Attribute relative HA-Pfade enthalten, die der
// Browser same-origin beim BFF anfragt.

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

const ALLOWED_PREFIXES = [
  '/api/media_player_proxy/',
  '/api/image/serve/',
  '/api/image_proxy/',
  '/api/camera_proxy/',
]

export function registerHaImageProxy(app: FastifyInstance): void {
  for (const prefix of ALLOWED_PREFIXES) {
    app.get(`${prefix}*`, async (request, reply) => {
      const path = request.raw.url
      if (!path || !ALLOWED_PREFIXES.some((p) => path.startsWith(p))) {
        reply.status(403)
        return { error: 'Pfad nicht erlaubt' }
      }

      try {
        const response = await fetch(`${config.haUrl}${path}`, {
          headers: { Authorization: `Bearer ${config.haToken}` },
          signal: AbortSignal.timeout(15_000),
        })
        reply.status(response.status)
        reply.header('content-type', response.headers.get('content-type') ?? 'image/jpeg')
        reply.header('cache-control', 'private, max-age=300')
        return reply.send(Buffer.from(await response.arrayBuffer()))
      } catch (err) {
        request.log.warn({ err, path }, 'HA-Bild-Proxy fehlgeschlagen')
        reply.status(502)
        return { error: 'Home Assistant nicht erreichbar' }
      }
    })
  }
}
