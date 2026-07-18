// /ws — Relay zwischen Browser-Clients und der einen HA-Upstream-Verbindung.
// Clients verbinden sich tokenlos; der BFF hält den HA-Token serverseitig.

import type { FastifyInstance } from 'fastify'
import type WebSocket from 'ws'
import type { HaConnection } from './connection.js'
import type {
  ClientMessage,
  InitMessage,
  ResultMessage,
} from '../../../shared/api-types.js'

// Bis Authelia vor dem BFF hängt: nur harmlose UI-Domains zulassen —
// der tokenlose Socket darf keine beliebigen HA-Services (shell_command etc.) auslösen.
const ALLOWED_DOMAINS = new Set([
  'light',
  'switch',
  'scene',
  'script',
  'media_player',
  'button',
  'select',
  'number',
  'fan',
  'input_boolean',
  'input_datetime',
  'input_select',
  'input_number',
])

interface TrackedSocket extends WebSocket {
  isAlive?: boolean
}

export function registerHaRelay(app: FastifyInstance, ha: HaConnection): void {
  const clients = new Set<TrackedSocket>()

  const broadcast = (payload: string) => {
    for (const client of clients) {
      if (client.readyState === client.OPEN) client.send(payload)
    }
  }

  // Ein state_changed → einmal serialisieren, an alle
  ha.on('state_changed', (entityId, newState) => {
    broadcast(
      JSON.stringify({ type: 'state_changed', entity_id: entityId, new_state: newState })
    )
  })

  // Nach (Re-)Connect: frischer Snapshot an alle verbundenen Clients
  ha.on('snapshot', (states) => {
    const init: InitMessage = { type: 'init', connected: true, states }
    broadcast(JSON.stringify(init))
  })

  ha.on('status', (connected) => {
    if (!connected) {
      broadcast(JSON.stringify({ type: 'ha_status', connected: false }))
    }
    // connected=true wird über das snapshot-init transportiert
  })

  // Liveness: tote Clients aufräumen
  const pingInterval = setInterval(() => {
    for (const client of clients) {
      if (client.isAlive === false) {
        client.terminate()
        clients.delete(client)
        continue
      }
      client.isAlive = false
      client.ping()
    }
  }, 30_000)

  app.addHook('onClose', () => clearInterval(pingInterval))

  app.get('/ws', { websocket: true }, (socket: TrackedSocket) => {
    clients.add(socket)
    socket.isAlive = true
    socket.on('pong', () => {
      socket.isAlive = true
    })

    const init: InitMessage = {
      type: 'init',
      connected: ha.connected,
      states: [...ha.states.values()],
    }
    socket.send(JSON.stringify(init))

    socket.on('message', (raw) => {
      let message: ClientMessage
      try {
        message = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (message.type !== 'call_service') return

      const clientId = message.id
      const respond = (result: Omit<ResultMessage, 'type' | 'id'>) => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: 'result', id: clientId, ...result }))
        }
      }

      if (!ALLOWED_DOMAINS.has(message.domain)) {
        respond({
          success: false,
          error: { code: 'forbidden', message: `Domain ${message.domain} nicht erlaubt` },
        })
        return
      }

      // Upstream-IDs vergibt die HaConnection selbst; das Result geht nur an
      // den Absender zurück (Client-IDs verschiedener Browser kollidieren sonst).
      ha.callService({
        domain: message.domain,
        service: message.service,
        target: message.target,
        service_data: message.service_data,
      })
        .then(() => respond({ success: true }))
        .catch((err: Error) =>
          respond({ success: false, error: { code: 'ha_error', message: err.message } })
        )
    })

    socket.on('close', () => {
      clients.delete(socket)
    })
  })
}
