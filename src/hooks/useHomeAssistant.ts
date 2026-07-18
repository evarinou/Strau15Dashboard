import { useEffect, useRef, useCallback, useState } from 'react'
import type { HassEntity, HassServiceCall } from '../types/homeassistant'
import type { ServerMessage } from '../../shared/api-types'

type ConnectionState = 'disconnected' | 'connecting' | 'authenticating' | 'connected'

interface UseHomeAssistantReturn {
  entities: Map<string, HassEntity>
  connectionState: ConnectionState
  callService: (call: HassServiceCall) => Promise<void>
  getEntity: (entityId: string) => HassEntity | undefined
}

// Der Browser spricht nicht mehr direkt mit Home Assistant, sondern mit dem
// BFF-Relay unter /ws (same-origin, tokenlos). Der BFF hält die eigentliche
// HA-Verbindung samt Token serverseitig.
function relayUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export function useHomeAssistant(): UseHomeAssistantReturn {
  const [entities, setEntities] = useState<Map<string, HassEntity>>(new Map())
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')

  const wsRef = useRef<WebSocket | null>(null)
  const messageIdRef = useRef(1)
  const pendingCallsRef = useRef<Map<number, { resolve: () => void; reject: (err: Error) => void }>>(new Map())
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectDelayRef = useRef(1000)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionState('connecting')
    const ws = new WebSocket(relayUrl())
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[BFF] WebSocket verbunden')
      reconnectDelayRef.current = 1000
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerMessage

      switch (message.type) {
        case 'init': {
          const newEntities = new Map<string, HassEntity>()
          for (const entity of message.states as HassEntity[]) {
            newEntities.set(entity.entity_id, entity)
          }
          setEntities(newEntities)
          setConnectionState(message.connected ? 'connected' : 'connecting')
          console.log(`[BFF] ${newEntities.size} Entities geladen (HA ${message.connected ? 'verbunden' : 'getrennt'})`)
          break
        }

        case 'state_changed': {
          const { entity_id, new_state } = message
          setEntities((prev) => {
            const next = new Map(prev)
            if (new_state) {
              next.set(entity_id, new_state as HassEntity)
            } else {
              next.delete(entity_id)
            }
            return next
          })
          break
        }

        case 'result': {
          const pendingCall = pendingCallsRef.current.get(message.id)
          if (pendingCall) {
            if (message.success) {
              pendingCall.resolve()
            } else {
              pendingCall.reject(new Error(message.error?.message || 'Unbekannter Fehler'))
            }
            pendingCallsRef.current.delete(message.id)
          }
          break
        }

        case 'ha_status':
          setConnectionState(message.connected ? 'connected' : 'connecting')
          break
      }
    }

    ws.onclose = () => {
      console.log('[BFF] WebSocket getrennt')
      setConnectionState('disconnected')
      wsRef.current = null

      // Reconnect mit exponential backoff
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log(`[BFF] Reconnect in ${reconnectDelayRef.current}ms...`)
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000)
        connect()
      }, reconnectDelayRef.current)
    }

    ws.onerror = (error) => {
      console.error('[BFF] WebSocket-Fehler:', error)
    }
  }, [])

  const callService = useCallback((call: HassServiceCall): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        reject(new Error('Nicht verbunden'))
        return
      }

      const id = messageIdRef.current++
      pendingCallsRef.current.set(id, { resolve, reject })

      wsRef.current.send(
        JSON.stringify({
          id,
          type: 'call_service',
          domain: call.domain,
          service: call.service,
          target: call.target,
          service_data: call.service_data,
        })
      )

      // Timeout nach 10 Sekunden
      setTimeout(() => {
        if (pendingCallsRef.current.has(id)) {
          pendingCallsRef.current.delete(id)
          reject(new Error('Service call timeout'))
        }
      }, 10000)
    })
  }, [])

  const getEntity = useCallback(
    (entityId: string): HassEntity | undefined => {
      return entities.get(entityId)
    },
    [entities]
  )

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    entities,
    connectionState,
    callService,
    getEntity,
  }
}
