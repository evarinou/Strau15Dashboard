// /api/links — öffentliche URLs der Hausdienste für anklickbare Links im
// Browser. Bewusst getrennt von den internen Service-URLs, die der BFF für
// seine API-Aufrufe nutzt.

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

export function registerLinkRoutes(app: FastifyInstance): void {
  app.get('/api/links', async (_request, reply) => {
    reply.header('cache-control', 'private, max-age=3600')
    return config.publicUrls
  })
}
