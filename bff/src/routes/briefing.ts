import type { FastifyInstance } from 'fastify'
import type { BriefingService } from '../briefing/briefing.js'

export function registerBriefingRoutes(app: FastifyInstance, briefing: BriefingService): void {
  app.get('/api/briefing', async (_request, reply) => {
    if (!briefing.enabled) {
      reply.status(503)
      return { disabled: true }
    }
    reply.header('cache-control', 'no-store')
    return briefing.get()
  })
}
