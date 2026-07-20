// Zugriffsschutz für Zugriffe von außerhalb des Heimnetzes.
//
// Zuhause soll niemand ein Login brauchen, um Licht zu machen — deshalb
// bleiben Anfragen aus privaten Netzen immer erlaubt. Kommt eine Anfrage
// dagegen aus dem Internet, muss sie den Header tragen, den ein
// vorgeschalteter Authelia (o.ä.) nach erfolgreichem Login setzt.
// Ohne diesen Header: 403 — statt Fremden Zugriff auf Haus und Kalender.

import type { FastifyInstance, FastifyRequest } from 'fastify'
import { config } from '../config.js'

/** Private/lokale Adressbereiche nach RFC1918 + Loopback + CGNAT + link-local */
function isPrivateAddress(ip: string): boolean {
  const addr = ip.replace(/^::ffff:/, '') // IPv4-mapped IPv6

  if (addr === '::1' || addr === '127.0.0.1') return true
  if (addr.startsWith('fc') || addr.startsWith('fd')) return true // IPv6 ULA
  if (addr.startsWith('fe80:')) return true // IPv6 link-local

  const octets = addr.split('.').map(Number)
  if (octets.length !== 4 || octets.some((o) => Number.isNaN(o))) return false
  const [a, b] = octets
  if (a === 10 || a === 127) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 169 && b === 254) return true
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT (Tailscale u.a.)
  return false
}

/** Pfade, die immer erreichbar bleiben — sonst schlägt der Container-Healthcheck fehl. */
function isPublicPath(url: string): boolean {
  return url === '/health' || url.startsWith('/health?')
}

export function isAuthorized(request: FastifyRequest): boolean {
  if (config.authHeader === null) return true // Schutz nicht aktiviert
  if (isPrivateAddress(request.ip)) return true // Heimnetz
  const value = request.headers[config.authHeader.toLowerCase()]
  return typeof value === 'string' && value.trim().length > 0
}

export function registerAuthGuard(app: FastifyInstance): void {
  if (config.authHeader === null) {
    console.warn(
      '[auth] AUTH_HEADER nicht gesetzt — Zugriffe aus dem Internet sind NICHT geschützt. ' +
        'Bei extern erreichbarem Dashboard bitte Authelia (o.ä.) vorschalten und ' +
        'AUTH_HEADER auf den gesetzten Header (z.B. Remote-User) konfigurieren.'
    )
    return
  }

  console.log(
    `[auth] Externe Zugriffe erfordern den Header "${config.authHeader}"; Heimnetz bleibt frei.`
  )

  app.addHook('onRequest', async (request, reply) => {
    if (isPublicPath(request.url) || isAuthorized(request)) return
    request.log.warn(
      { ip: request.ip, url: request.url },
      'Externer Zugriff ohne Authentifizierung abgewiesen'
    )
    reply.status(403)
    return reply.send({ error: 'Nicht angemeldet' })
  })
}
