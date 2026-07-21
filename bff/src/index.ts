import { existsSync } from 'node:fs'
import Fastify from 'fastify'
import fastifyCompress from '@fastify/compress'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import { config, logFeatureStatus } from './config.js'
import { HaConnection } from './ha/connection.js'
import { registerHaRelay } from './ha/relay.js'
import { BriefingService } from './briefing/briefing.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerChoreQuestProxy } from './routes/chorequest.js'
import { registerHaImageProxy } from './routes/ha-proxy.js'
import { registerBriefingRoutes } from './routes/briefing.js'
import { registerCalendarRoutes } from './routes/calendar.js'
import { registerPhotoRoutes } from './routes/photos.js'
import { registerTaskRoutes } from './routes/tasks.js'
import { registerDocumentRoutes } from './routes/documents.js'
import { registerMediaRoutes } from './routes/media.js'
import { registerLinkRoutes } from './routes/links.js'
import { registerAuthGuard } from './lib/auth.js'

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  // Ohne trustProxy wäre request.ip immer die des Reverse Proxy — jeder
  // externe Zugriff sähe dann wie „aus dem Heimnetz" aus.
  trustProxy: config.trustProxy,
})

logFeatureStatus()

// Der Verbindungsaufbau zu HA darf den Serverstart nicht blockieren —
// /health muss auch ohne HA sofort 200 liefern.
const ha = new HaConnection(config.haWsUrl, config.haToken)
ha.start()

const briefing = new BriefingService(ha)
await briefing.start()

await app.register(fastifyWebsocket)
await app.register(fastifyCompress)

// Vor allen Routen: externe Zugriffe brauchen ein Login (siehe lib/auth.ts).
// Gilt auch für den /ws-Upgrade — der Guard hängt in onRequest.
registerAuthGuard(app)

registerHealthRoutes(app, ha)
registerHaRelay(app, ha)
registerChoreQuestProxy(app)
registerHaImageProxy(app)
registerBriefingRoutes(app, briefing)
registerCalendarRoutes(app)
registerPhotoRoutes(app)
registerTaskRoutes(app)
registerDocumentRoutes(app)
registerMediaRoutes(app)
registerLinkRoutes(app)

// SPA-Auslieferung: Vite hasht Asset-Dateinamen → /assets/* darf aggressiv
// gecacht werden; index.html nie (sonst zeigt der Browser alte Bundles).
if (existsSync(config.publicDir)) {
  await app.register(fastifyStatic, {
    root: config.publicDir,
    cacheControl: false,
    setHeaders: (res, filePath) => {
      if (filePath.includes('/assets/')) {
        res.setHeader('cache-control', 'public, max-age=31536000, immutable')
      } else {
        res.setHeader('cache-control', 'no-store')
      }
    },
  })

  // SPA-Fallback für Client-Routen (/music, /room/... etc.)
  app.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api')) {
      return reply.sendFile('index.html')
    }
    reply.status(404)
    return reply.send({ error: 'Not found' })
  })
} else {
  app.log.warn(`PUBLIC_DIR ${config.publicDir} existiert nicht — nur API-Modus (Dev)`)
}

const shutdown = async () => {
  ha.stop()
  briefing.stop()
  await app.close()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
