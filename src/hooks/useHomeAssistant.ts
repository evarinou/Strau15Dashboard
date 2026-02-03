import { useEffect, useRef, useCallback, useState } from 'react'
import type {
  HassEntity,
  HassAuthMessage,
  HassResultMessage,
  HassEventMessage,
  HassServiceCall,
} from '../types/homeassistant'

const HA_WS_URL = import.meta.env.VITE_HA_WS_URL
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN

type ConnectionState = 'disconnected' | 'connecting' | 'authenticating' | 'connected'

interface UseHomeAssistantReturn {
  entities: Map<string, HassEntity>
  connectionState: ConnectionState
  callService: (call: HassServiceCall) => Promise<void>
  getEntity: (entityId: string) => HassEntity | undefined
}

export function useHomeAssistant(): UseHomeAssistantReturn {
  const [entities, setEntities] = useState<Map<string, HassEntity>>(new Map())
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')

  const wsRef = useRef<WebSocket | null>(null)
  const messageIdRef = useRef(1)
  const pendingCallsRef = useRef<Map<number, { resolve: () => void; reject: (err: Error) => void }>>(new Map())
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectDelayRef = useRef(1000)

  const getNextMessageId = useCallback(() => {
    return messageIdRef.current++
  }, [])

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionState('connecting')
    const ws = new WebSocket(HA_WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[HA] WebSocket connected')
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      switch (message.type) {
        case 'auth_required':
          setConnectionState('authenticating')
          const authMessage: HassAuthMessage = {
            type: 'auth',
            access_token: HA_TOKEN,
          }
          ws.send(JSON.stringify(authMessage))
          break

        case 'auth_ok':
          console.log('[HA] Authenticated')
          setConnectionState('connected')
          reconnectDelayRef.current = 1000

          // Subscribe to state changes
          const subscribeId = getNextMessageId()
          sendMessage({
            id: subscribeId,
            type: 'subscribe_events',
            event_type: 'state_changed',
          })

          // Fetch all states
          const statesId = getNextMessageId()
          sendMessage({
            id: statesId,
            type: 'get_states',
          })
          break

        case 'auth_invalid':
          console.error('[HA] Authentication failed')
          setConnectionState('disconnected')
          ws.close()
          break

        case 'result':
          const resultMsg = message as HassResultMessage
          if (resultMsg.success && Array.isArray(resultMsg.result)) {
            // Initial states response
            const newEntities = new Map<string, HassEntity>()
            for (const entity of resultMsg.result as HassEntity[]) {
              newEntities.set(entity.entity_id, entity)
            }
            setEntities(newEntities)
            console.log(`[HA] Loaded ${newEntities.size} entities`)
          }

          // Resolve pending service calls
          const pendingCall = pendingCallsRef.current.get(resultMsg.id)
          if (pendingCall) {
            if (resultMsg.success) {
              pendingCall.resolve()
            } else {
              pendingCall.reject(new Error(resultMsg.error?.message || 'Unknown error'))
            }
            pendingCallsRef.current.delete(resultMsg.id)
          }
          break

        case 'event':
          const eventMsg = message as HassEventMessage
          if (eventMsg.event.event_type === 'state_changed') {
            const { entity_id, new_state } = eventMsg.event.data
            setEntities((prev) => {
              const next = new Map(prev)
              if (new_state) {
                next.set(entity_id, new_state)
              } else {
                next.delete(entity_id)
              }
              return next
            })
          }
          break
      }
    }

    ws.onclose = () => {
      console.log('[HA] WebSocket disconnected')
      setConnectionState('disconnected')
      wsRef.current = null

      // Reconnect with exponential backoff
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log(`[HA] Reconnecting in ${reconnectDelayRef.current}ms...`)
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000)
        connect()
      }, reconnectDelayRef.current)
    }

    ws.onerror = (error) => {
      console.error('[HA] WebSocket error:', error)
    }
  }, [getNextMessageId, sendMessage])

  const callService = useCallback(
    (call: HassServiceCall): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          reject(new Error('Not connected'))
          return
        }

        const id = getNextMessageId()
        pendingCallsRef.current.set(id, { resolve, reject })

        sendMessage({
          id,
          type: 'call_service',
          domain: call.domain,
          service: call.service,
          target: call.target,
          service_data: call.service_data,
        })

        // Timeout after 10 seconds
        setTimeout(() => {
          if (pendingCallsRef.current.has(id)) {
            pendingCallsRef.current.delete(id)
            reject(new Error('Service call timeout'))
          }
        }, 10000)
      })
    },
    [getNextMessageId, sendMessage]
  )

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
