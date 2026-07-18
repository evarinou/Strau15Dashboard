// Gemeinsame Typen für das WebSocket-Protokoll zwischen Frontend und BFF.
// Wird von beiden tsconfigs inkludiert — keine Runtime-Imports, nur Typen.

export interface HassEntity {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
  last_changed: string
  last_updated: string
  context: {
    id: string
    parent_id: string | null
    user_id: string | null
  }
}

export interface HassServiceCall {
  domain: string
  service: string
  target?: {
    entity_id?: string | string[]
    area_id?: string | string[]
    device_id?: string | string[]
  }
  service_data?: Record<string, unknown>
}

// ---- BFF → Browser ----

/** Snapshot bei Verbindungsaufbau (und nach HA-Reconnect erneut). */
export interface InitMessage {
  type: 'init'
  /** Ist der BFF gerade mit Home Assistant verbunden? */
  connected: boolean
  states: HassEntity[]
}

export interface StateChangedMessage {
  type: 'state_changed'
  entity_id: string
  /** null = Entity wurde entfernt */
  new_state: HassEntity | null
}

/** Antwort auf einen call_service des Clients (nur an den Absender). */
export interface ResultMessage {
  type: 'result'
  id: number
  success: boolean
  error?: { code: string; message: string }
}

/** Upstream-Verbindungsstatus hat sich geändert. */
export interface HaStatusMessage {
  type: 'ha_status'
  connected: boolean
}

export type ServerMessage =
  | InitMessage
  | StateChangedMessage
  | ResultMessage
  | HaStatusMessage

// ---- Browser → BFF ----

export interface CallServiceMessage extends HassServiceCall {
  type: 'call_service'
  /** Client-lokale ID; kommt in der ResultMessage zurück. */
  id: number
}

export type ClientMessage = CallServiceMessage
