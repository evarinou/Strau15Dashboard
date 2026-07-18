// /api/chorequest/* → ${CHOREQUEST_URL}/api/* mit serverseitigem Bearer-Token.

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'
import { UpstreamError } from '../lib/upstream.js'

export function registerChoreQuestProxy(app: FastifyInstance): void {
  app.route({
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    url: '/api/chorequest/*',
    handler: async (request, reply) => {
      const subPath = (request.params as { '*': string })['*']
      const query = request.raw.url?.split('?')[1]
      const url = `${config.choreQuestUrl}/api/${subPath}${query ? `?${query}` : ''}`

      try {
        const response = await fetch(url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.choreQuestToken}`,
          },
          body:
            request.method === 'GET' || request.method === 'DELETE'
              ? undefined
              : JSON.stringify(request.body ?? {}),
          signal: AbortSignal.timeout(10_000),
        })

        reply.status(response.status)
        if (response.status === 204) return null
        reply.header('content-type', response.headers.get('content-type') ?? 'application/json')
        return await response.text()
      } catch (err) {
        if (err instanceof UpstreamError) throw err
        request.log.error({ err, url }, 'ChoreQuest-Upstream nicht erreichbar')
        reply.status(502)
        return { error: 'ChoreQuest nicht erreichbar' }
      }
    },
  })
}
