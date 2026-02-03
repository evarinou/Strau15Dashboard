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

export interface HassLightAttributes {
  friendly_name?: string
  brightness?: number
  color_temp?: number
  rgb_color?: [number, number, number]
  hs_color?: [number, number]
  xy_color?: [number, number]
  supported_features?: number
  supported_color_modes?: string[]
  color_mode?: string
  min_mireds?: number
  max_mireds?: number
}

export interface HassClimateAttributes {
  friendly_name?: string
  current_temperature?: number
  temperature?: number
  target_temp_high?: number
  target_temp_low?: number
  hvac_modes?: string[]
  hvac_action?: string
  preset_modes?: string[]
  preset_mode?: string
}

export interface HassMediaPlayerAttributes {
  friendly_name?: string
  volume_level?: number
  is_volume_muted?: boolean
  media_content_id?: string
  media_content_type?: string
  media_title?: string
  media_artist?: string
  media_album_name?: string
  media_duration?: number
  media_position?: number
  source?: string
  source_list?: string[]
}

export interface HassVacuumAttributes {
  friendly_name?: string
  battery_level?: number
  status?: string
  fan_speed?: string
  fan_speed_list?: string[]
}

export interface HassPersonAttributes {
  friendly_name?: string
  entity_picture?: string
  source?: string
}

export type HassEntityWithAttributes<T> = Omit<HassEntity, 'attributes'> & {
  attributes: T
}

export type HassLight = HassEntityWithAttributes<HassLightAttributes>
export type HassClimate = HassEntityWithAttributes<HassClimateAttributes>
export type HassMediaPlayer = HassEntityWithAttributes<HassMediaPlayerAttributes>
export type HassVacuum = HassEntityWithAttributes<HassVacuumAttributes>
export type HassPerson = HassEntityWithAttributes<HassPersonAttributes>

export interface HassStateChangedEvent {
  event_type: 'state_changed'
  data: {
    entity_id: string
    old_state: HassEntity | null
    new_state: HassEntity | null
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

export interface HassWebSocketMessage {
  id?: number
  type: string
  [key: string]: unknown
}

export interface HassAuthMessage {
  type: 'auth'
  access_token: string
}

export interface HassResultMessage {
  id: number
  type: 'result'
  success: boolean
  result?: unknown
  error?: {
    code: string
    message: string
  }
}

export interface HassEventMessage {
  id: number
  type: 'event'
  event: HassStateChangedEvent
}
