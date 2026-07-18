// Serverseitige Home-Assistant-WebSocket-Verbindung.
// Portiert aus src/hooks/useHomeAssistant.ts (Auth-Handshake, Reconnect mit
// exponential Backoff, id-basierte Result-Zuordnung), ohne React.

import { EventEmitter } from 'node:events'
import WebSocket from 'ws'
import type { HassEntity, HassServiceCall } from '../../../shared/api-types.js'

interface PendingCall {
  resolve: () => void
  reject: (err: Error) => void
  timer: NodeJS.Timeout
}

export interface HaConnectionEvents {
  /** Einzelnes state_changed-Event (new_state === null → Entity entfernt) */
  state_changed: [entityId: string, newState: HassEntity | null]
  /** Frischer Komplett-Snapshot (nach Connect/Reconnect) */
  snapshot: [states: HassEntity[]]
  /** Upstream-Verbindungsstatus */
  status: [connected: boolean]
}

export class HaConnection extends EventEmitter<HaConnectionEvents> {
  private ws: WebSocket | null = null
  private messageId = 1
  private statesRequestId: number | null = null
  private pendingCalls = new Map<number, PendingCall>()
  private reconnectDelay = 1000
  private reconnectTimer: NodeJS.Timeout | null = null
  private stopped = false

  readonly states = new Map<string, HassEntity>()
  connected = false

  constructor(
    private readonly wsUrl: string,
    private readonly token: string
  ) {
    super()
  }

  start(): void {
    this.stopped = false
    this.connect()
  }

  stop(): void {
    this.stopped = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
  }

  private connect(): void {
    if (this.stopped) return
    console.log(`[ha] Verbinde zu ${this.wsUrl}`)

    const ws = new WebSocket(this.wsUrl)
    this.ws = ws

    ws.on('message', (data) => {
      let message: Record<string, unknown>
      try {
        message = JSON.parse(data.toString())
      } catch {
        return
      }
      this.handleMessage(message)
    })

    ws.on('close', () => {
      const wasConnected = this.connected
      this.connected = false
      this.ws = null
      this.rejectAllPending(new Error('HA-Verbindung geschlossen'))
      if (wasConnected) this.emit('status', false)
      this.scheduleReconnect()
    })

    ws.on('error', (err) => {
      console.error('[ha] WebSocket-Fehler:', err.message)
      // close-Event folgt und übernimmt den Reconnect
    })
  }

  private handleMessage(message: Record<string, unknown>): void {
    switch (message.type) {
      case 'auth_required':
        this.ws?.send(JSON.stringify({ type: 'auth', access_token: this.token }))
        break

      case 'auth_ok': {
        console.log('[ha] Authentifiziert')
        this.reconnectDelay = 1000
        // Reihenfolge wichtig: erst subscriben, dann Snapshot holen —
        // sonst können Events zwischen get_states und subscribe verloren gehen.
        this.send({ id: this.nextId(), type: 'subscribe_events', event_type: 'state_changed' })
        this.statesRequestId = this.nextId()
        this.send({ id: this.statesRequestId, type: 'get_states' })
        break
      }

      case 'auth_invalid':
        console.error('[ha] Authentifizierung fehlgeschlagen — HA_TOKEN prüfen!')
        this.ws?.close()
        break

      case 'result': {
        const id = message.id as number
        if (id === this.statesRequestId && message.success && Array.isArray(message.result)) {
          this.states.clear()
          for (const entity of message.result as HassEntity[]) {
            this.states.set(entity.entity_id, entity)
          }
          this.statesRequestId = null
          this.connected = true
          console.log(`[ha] ${this.states.size} Entities geladen`)
          this.emit('status', true)
          this.emit('snapshot', [...this.states.values()])
          break
        }

        const pending = this.pendingCalls.get(id)
        if (pending) {
          clearTimeout(pending.timer)
          this.pendingCalls.delete(id)
          if (message.success) {
            pending.resolve()
          } else {
            const error = message.error as { message?: string } | undefined
            pending.reject(new Error(error?.message || 'Unbekannter HA-Fehler'))
          }
        }
        break
      }

      case 'event': {
        const event = message.event as {
          event_type: string
          data: { entity_id: string; new_state: HassEntity | null }
        }
        if (event?.event_type === 'state_changed') {
          const { entity_id, new_state } = event.data
          if (new_state) {
            this.states.set(entity_id, new_state)
          } else {
            this.states.delete(entity_id)
          }
          this.emit('state_changed', entity_id, new_state)
        }
        break
      }
    }
  }

  callService(call: HassServiceCall): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WebSocket.OPEN || !this.connected) {
        reject(new Error('Nicht mit Home Assistant verbunden'))
        return
      }

      const id = this.nextId()
      const timer = setTimeout(() => {
        if (this.pendingCalls.delete(id)) {
          reject(new Error('Service-Call-Timeout'))
        }
      }, 10_000)

      this.pendingCalls.set(id, { resolve, reject, timer })
      this.send({
        id,
        type: 'call_service',
        domain: call.domain,
        service: call.service,
        target: call.target,
        service_data: call.service_data,
      })
    })
  }

  private send(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private nextId(): number {
    return this.messageId++
  }

  private rejectAllPending(err: Error): void {
    for (const pending of this.pendingCalls.values()) {
      clearTimeout(pending.timer)
      pending.reject(err)
    }
    this.pendingCalls.clear()
  }

  private scheduleReconnect(): void {
    if (this.stopped) return
    console.log(`[ha] Reconnect in ${this.reconnectDelay}ms`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
      this.connect()
    }, this.reconnectDelay)
  }
}
