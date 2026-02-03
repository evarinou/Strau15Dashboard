import { createContext, useContext, type ReactNode } from 'react'
import { useHomeAssistant } from '../hooks/useHomeAssistant'
import type { HassEntity, HassServiceCall } from '../types/homeassistant'

// Home Assistant base URL and token for image proxy
const HA_URL = import.meta.env.VITE_HA_URL || 'http://strau15machine:8123'
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || ''

interface HomeAssistantContextValue {
  entities: Map<string, HassEntity>
  connectionState: 'disconnected' | 'connecting' | 'authenticating' | 'connected'
  callService: (call: HassServiceCall) => Promise<void>
  getEntity: (entityId: string) => HassEntity | undefined
}

const HomeAssistantContext = createContext<HomeAssistantContextValue | null>(null)

interface HomeAssistantProviderProps {
  children: ReactNode
}

export function HomeAssistantProvider({ children }: HomeAssistantProviderProps) {
  const ha = useHomeAssistant()

  return (
    <HomeAssistantContext.Provider value={ha}>
      {children}
    </HomeAssistantContext.Provider>
  )
}

export function useHA() {
  const context = useContext(HomeAssistantContext)
  if (!context) {
    throw new Error('useHA must be used within a HomeAssistantProvider')
  }
  return context
}

// Convenience hooks for specific entity types
export function useLight(entityId: string) {
  const { getEntity, callService } = useHA()
  const entity = getEntity(entityId)
  const attrs = entity?.attributes || {}

  const toggle = () =>
    callService({
      domain: 'light',
      service: 'toggle',
      target: { entity_id: entityId },
    })

  const turnOn = (brightness?: number) =>
    callService({
      domain: 'light',
      service: 'turn_on',
      target: { entity_id: entityId },
      service_data: brightness !== undefined ? { brightness } : undefined,
    })

  const turnOff = () =>
    callService({
      domain: 'light',
      service: 'turn_off',
      target: { entity_id: entityId },
    })

  const setBrightness = (brightness: number) =>
    callService({
      domain: 'light',
      service: 'turn_on',
      target: { entity_id: entityId },
      service_data: { brightness },
    })

  // Color control methods
  const setRgbColor = (rgb: [number, number, number]) =>
    callService({
      domain: 'light',
      service: 'turn_on',
      target: { entity_id: entityId },
      service_data: { rgb_color: rgb },
    })

  const setHsColor = (hs: [number, number]) =>
    callService({
      domain: 'light',
      service: 'turn_on',
      target: { entity_id: entityId },
      service_data: { hs_color: hs },
    })

  const setColorTemp = (mireds: number) =>
    callService({
      domain: 'light',
      service: 'turn_on',
      target: { entity_id: entityId },
      service_data: { color_temp: mireds },
    })

  // Check supported color modes
  const supportedColorModes = (attrs.supported_color_modes as string[] | undefined) || []
  const supportsColor = supportedColorModes.includes('rgb') ||
                        supportedColorModes.includes('hs') ||
                        supportedColorModes.includes('xy')
  const supportsColorTemp = supportedColorModes.includes('color_temp')

  return {
    entity,
    isOn: entity?.state === 'on',
    isUnavailable: entity?.state === 'unavailable',
    brightness: attrs.brightness as number | undefined,
    friendlyName: attrs.friendly_name as string | undefined,
    // Color attributes
    rgbColor: attrs.rgb_color as [number, number, number] | undefined,
    hsColor: attrs.hs_color as [number, number] | undefined,
    colorTemp: attrs.color_temp as number | undefined,
    minMireds: attrs.min_mireds as number | undefined,
    maxMireds: attrs.max_mireds as number | undefined,
    colorMode: attrs.color_mode as string | undefined,
    // Feature detection
    supportsColor,
    supportsColorTemp,
    // Methods
    toggle,
    turnOn,
    turnOff,
    setBrightness,
    setRgbColor,
    setHsColor,
    setColorTemp,
  }
}

export function useSwitch(entityId: string) {
  const { getEntity, callService } = useHA()
  const entity = getEntity(entityId)

  const toggle = () =>
    callService({
      domain: 'switch',
      service: 'toggle',
      target: { entity_id: entityId },
    })

  const turnOn = () =>
    callService({
      domain: 'switch',
      service: 'turn_on',
      target: { entity_id: entityId },
    })

  const turnOff = () =>
    callService({
      domain: 'switch',
      service: 'turn_off',
      target: { entity_id: entityId },
    })

  return {
    entity,
    isOn: entity?.state === 'on',
    isUnavailable: entity?.state === 'unavailable',
    friendlyName: entity?.attributes?.friendly_name as string | undefined,
    toggle,
    turnOn,
    turnOff,
  }
}

export function useScene(entityId: string) {
  const { getEntity, callService } = useHA()
  const entity = getEntity(entityId)

  const activate = () =>
    callService({
      domain: 'scene',
      service: 'turn_on',
      target: { entity_id: entityId },
    })

  return {
    entity,
    friendlyName: entity?.attributes?.friendly_name as string | undefined,
    activate,
  }
}

export function useScript(entityId: string) {
  const { getEntity, callService } = useHA()
  const entity = getEntity(entityId)

  const run = () =>
    callService({
      domain: 'script',
      service: 'turn_on',
      target: { entity_id: entityId },
    })

  return {
    entity,
    isRunning: entity?.state === 'on',
    friendlyName: entity?.attributes?.friendly_name as string | undefined,
    run,
  }
}

export function useMediaPlayer(entityId: string) {
  const { getEntity, callService } = useHA()
  const entity = getEntity(entityId)
  const attrs = entity?.attributes || {}

  const play = () =>
    callService({
      domain: 'media_player',
      service: 'media_play',
      target: { entity_id: entityId },
    })

  const pause = () =>
    callService({
      domain: 'media_player',
      service: 'media_pause',
      target: { entity_id: entityId },
    })

  const stop = () =>
    callService({
      domain: 'media_player',
      service: 'media_stop',
      target: { entity_id: entityId },
    })

  const setVolume = (volume: number) =>
    callService({
      domain: 'media_player',
      service: 'volume_set',
      target: { entity_id: entityId },
      service_data: { volume_level: volume },
    })

  const volumeUp = () =>
    callService({
      domain: 'media_player',
      service: 'volume_up',
      target: { entity_id: entityId },
    })

  const volumeDown = () =>
    callService({
      domain: 'media_player',
      service: 'volume_down',
      target: { entity_id: entityId },
    })

  return {
    entity,
    state: entity?.state,
    isPlaying: entity?.state === 'playing',
    isPaused: entity?.state === 'paused',
    isIdle: entity?.state === 'idle',
    isUnavailable: entity?.state === 'unavailable',
    volume: attrs.volume_level as number | undefined,
    isMuted: attrs.is_volume_muted as boolean | undefined,
    mediaTitle: attrs.media_title as string | undefined,
    mediaArtist: attrs.media_artist as string | undefined,
    friendlyName: attrs.friendly_name as string | undefined,
    play,
    pause,
    stop,
    setVolume,
    volumeUp,
    volumeDown,
  }
}

export function useVacuum(entityId: string) {
  const { getEntity, callService } = useHA()
  const entity = getEntity(entityId)
  const attrs = entity?.attributes || {}

  const start = () =>
    callService({
      domain: 'vacuum',
      service: 'start',
      target: { entity_id: entityId },
    })

  const stop = () =>
    callService({
      domain: 'vacuum',
      service: 'stop',
      target: { entity_id: entityId },
    })

  const pause = () =>
    callService({
      domain: 'vacuum',
      service: 'pause',
      target: { entity_id: entityId },
    })

  const returnToBase = () =>
    callService({
      domain: 'vacuum',
      service: 'return_to_base',
      target: { entity_id: entityId },
    })

  return {
    entity,
    state: entity?.state,
    isDocked: entity?.state === 'docked',
    isCleaning: entity?.state === 'cleaning',
    isReturning: entity?.state === 'returning',
    battery: attrs.battery_level as number | undefined,
    friendlyName: attrs.friendly_name as string | undefined,
    start,
    stop,
    pause,
    returnToBase,
  }
}

export function useClimate(entityId: string) {
  const { getEntity, callService } = useHA()
  const entity = getEntity(entityId)
  const attrs = entity?.attributes || {}

  const setTemperature = (temperature: number) =>
    callService({
      domain: 'climate',
      service: 'set_temperature',
      target: { entity_id: entityId },
      service_data: { temperature },
    })

  const setHvacMode = (mode: string) =>
    callService({
      domain: 'climate',
      service: 'set_hvac_mode',
      target: { entity_id: entityId },
      service_data: { hvac_mode: mode },
    })

  return {
    entity,
    state: entity?.state,
    currentTemperature: attrs.current_temperature as number | undefined,
    targetTemperature: attrs.temperature as number | undefined,
    hvacModes: attrs.hvac_modes as string[] | undefined,
    hvacAction: attrs.hvac_action as string | undefined,
    friendlyName: attrs.friendly_name as string | undefined,
    setTemperature,
    setHvacMode,
  }
}

// 3D Printer (Bambu Lab) integration
export type PrinterStatus = 'idle' | 'printing' | 'paused' | 'finished' | 'error' | 'unknown'
export type SpeedMode = 'silent' | 'standard' | 'sport' | 'ludicrous'

export interface AMSTrayData {
  slot: number
  material: string | null
  color: string | null
  colorHex: string | null
  remaining: number | null
  isActive: boolean
  isEmpty: boolean
}

export interface AMSUnitData {
  id: number
  name: string
  trays: AMSTrayData[]
  humidity: number | null
  humidityIndex: number | null
  temperature: number | null
  drying: boolean
  dryingTime: number | null
}

export interface FanData {
  id: string
  label: string
  type: 'aux' | 'chamber' | 'cooling' | 'generic'
  speed: number | null
  isOn: boolean
  entityId: string | null
  canControl: boolean
}

export interface PrinterState {
  // Status
  status: PrinterStatus
  statusText: string
  printStage: string | null

  // Temperatures
  nozzleTemp: number | null
  nozzleTargetTemp: number | null
  bedTemp: number | null
  bedTargetTemp: number | null
  chamberTemp: number | null

  // Print info
  printProgress: number | null
  currentLayer: number | null
  totalLayers: number | null
  remainingTime: number | null
  jobName: string | null
  startTime: Date | null
  endTime: Date | null

  // Speed
  speedMode: SpeedMode
  printSpeed: number | null

  // Fans
  fans: FanData[]
  auxFanSpeed: number | null
  chamberFanSpeed: number | null
  coolingFanSpeed: number | null

  // AMS
  amsUnits: AMSUnitData[]
  activeTray: string | null
  activeTrayColor: string | null

  // Camera
  cameraUrl: string | null
  cameraAvailable: boolean

  // Notifications
  hmsNotifications: string | null

  // Firmware
  firmwareVersion: string | null

  // Lights
  chamberLightEntity: string | null
  chamberLightOn: boolean
  roomLightEntity: string | null
  roomLightOn: boolean

  // Availability
  isAvailable: boolean
  friendlyName: string

  // Actions
  toggleChamberLight: () => void
  toggleRoomLight: () => void
  pausePrint: () => void
  resumePrint: () => void
  stopPrint: () => void
  setFanSpeed: (fanId: string, speed: number) => void
  setSpeedMode: (mode: SpeedMode) => void
  setNozzleTemp: (temp: number) => void
  setBedTemp: (temp: number) => void
}

// Entity pattern matchers for Bambu Lab printers
const PRINTER_PATTERNS = {
  // Temperatures
  nozzleTemp: [/sensor\..+_(nozzle_temp|temperatur_der_duse|nozzle_temperature)/i],
  nozzleTargetTemp: [/sensor\..+_(nozzle_target|target_nozzle_temp)/i, /number\..+_nozzle_temp/i],
  bedTemp: [/sensor\..+_(bed_temp|druckbetttemperatur|heatbed_temp|bed_temperature)/i],
  bedTargetTemp: [/sensor\..+_(bed_target|target_bed_temp)/i, /number\..+_bed_temp/i],
  chamberTemp: [/sensor\..+_chamber_temp/i],

  // Print status and progress
  status: [/sensor\..+_(current_stage|print_status|stage|status)$/i],
  progress: [/sensor\..+_(print_progress|progress|percentage)/i],
  currentLayer: [/sensor\..+_(current_layer|layer)/i],
  totalLayers: [/sensor\..+_(total_layer|total_layers)/i],
  remainingTime: [/sensor\..+_(remaining_time|time_remaining|eta)/i],
  jobName: [/sensor\..+_(task_name|job_name|gcode_file|file_name)/i],
  printStage: [/sensor\..+_(print_stage|current_stage|stage)/i],

  // Timing
  startTime: [/sensor\..+_(start_time|print_start)/i],
  endTime: [/sensor\..+_(end_time|print_end|finish_time)/i],

  // Speed
  speedMode: [/select\..+_(speed_mode|print_speed_mode)/i, /sensor\..+_speed_mode/i],
  printSpeed: [/sensor\..+_(print_speed|speed_percent|speed_magnitude)/i],

  // Fans
  auxFan: [/fan\..+_(aux|auxiliary)/i, /sensor\..+_(aux_fan|auxiliary_fan)/i],
  chamberFan: [/fan\..+_chamber/i, /sensor\..+_chamber_fan/i],
  coolingFan: [/fan\..+_(cooling|part_cooling)/i, /sensor\..+_(cooling_fan|part_fan)/i],

  // AMS
  amsHumidity: [/sensor\..+_ams.*humidity/i],
  amsTemp: [/sensor\..+_ams.*temp/i],
  amsDrying: [/binary_sensor\..+_ams.*drying/i, /sensor\..+_ams.*drying/i],
  activeTray: [/sensor\..+_(active_tray|current_tray|selected_tray)/i],
  trayColor: [/sensor\..+_tray.*color/i],
  trayMaterial: [/sensor\..+_tray.*(material|type|filament)/i],
  trayRemaining: [/sensor\..+_tray.*(remaining|level)/i],

  // Camera
  camera: [/camera\..+/i, /image\..+_camera/i],

  // HMS/Notifications
  hms: [/sensor\..+_(hms|notification|error_message)/i],

  // Firmware
  firmware: [/sensor\..+_(firmware|version)/i],

  // Controls
  chamberLight: [/light\..+_(chamber|kammer|auxiliary)/i],
  roomLight: [/light\..+_druckraumbeleuchtung/i],

  // Buttons for control
  pauseButton: [/button\..+_pause/i],
  resumeButton: [/button\..+_resume/i],
  stopButton: [/button\..+_stop/i],

  // Number inputs for temperature control
  nozzleTempInput: [/number\..+_(nozzle_temp|target_nozzle)/i],
  bedTempInput: [/number\..+_(bed_temp|target_bed)/i],
}

function findEntityByPatterns(
  entities: Map<string, HassEntity>,
  prefix: string,
  patterns: RegExp[]
): string | null {
  // First try to find with the exact prefix
  for (const [entityId, _entity] of entities) {
    if (!entityId.includes(prefix)) continue
    for (const pattern of patterns) {
      if (pattern.test(entityId)) {
        return entityId
      }
    }
  }
  return null
}

function parseNumericState(entity: HassEntity | undefined): number | null {
  if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') {
    return null
  }
  const value = parseFloat(entity.state)
  return isNaN(value) ? null : value
}

function mapPrinterStatus(state: string | undefined): PrinterStatus {
  if (!state || state === 'unavailable' || state === 'unknown') return 'unknown'

  const s = state.toLowerCase()

  // Bambu Lab specific states
  if (s === 'idle' || s === 'finish' || s === 'offline') return 'idle'
  if (s === 'printing' || s === 'running' || s === 'prepare') return 'printing'
  if (s === 'paused' || s === 'pause') return 'paused'
  if (s === 'finish' || s === 'finished' || s === 'complete') return 'finished'
  if (s === 'failed' || s === 'error') return 'error'

  // Check for common words
  if (s.includes('print') || s.includes('druck')) return 'printing'
  if (s.includes('paus')) return 'paused'
  if (s.includes('finish') || s.includes('fertig') || s.includes('complete')) return 'finished'
  if (s.includes('error') || s.includes('fehler') || s.includes('fail')) return 'error'

  return 'idle'
}

function parseDateTime(entity: HassEntity | undefined): Date | null {
  if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') return null
  const date = new Date(entity.state)
  return isNaN(date.getTime()) ? null : date
}

function mapSpeedMode(state: string | undefined): SpeedMode {
  if (!state) return 'standard'
  const s = state.toLowerCase()
  if (s.includes('silent') || s.includes('leise')) return 'silent'
  if (s.includes('sport')) return 'sport'
  if (s.includes('ludicrous') || s.includes('max')) return 'ludicrous'
  return 'standard'
}

function findAllEntitiesByPattern(
  entities: Map<string, HassEntity>,
  prefix: string,
  pattern: RegExp
): string[] {
  const results: string[] = []
  for (const [entityId] of entities) {
    if (entityId.includes(prefix) && pattern.test(entityId)) {
      results.push(entityId)
    }
  }
  return results
}

// Vacuum (Roborock) extended integration
export type VacuumStatus = 'docked' | 'idle' | 'cleaning' | 'paused' | 'returning' | 'error' | 'unknown'
export type FanSpeedMode = 'Silent' | 'Standard' | 'Medium' | 'Turbo'
export type MopIntensity = 'Off' | 'Low' | 'Medium' | 'High'

export interface VacuumExtendedState {
  // Status
  status: VacuumStatus
  statusText: string
  battery: number | null
  isCharging: boolean

  // Modes
  fanSpeed: FanSpeedMode
  fanSpeedList: FanSpeedMode[]
  mopIntensity: MopIntensity
  mopIntensityList: MopIntensity[]

  // Stats - Last cleaning
  lastCleanArea: number | null      // m²
  lastCleanDuration: number | null  // seconds
  lastCleanStart: Date | null
  lastCleanEnd: Date | null

  // Stats - Total
  totalCleanArea: number | null     // m²
  totalCleanCount: number | null
  totalCleanTime: number | null     // hours

  // Consumables (percentage remaining)
  mainBrushLeft: number | null
  sideBrushLeft: number | null
  filterLeft: number | null
  sensorLeft: number | null

  // Map
  mapImageUrl: string | null
  mapAvailable: boolean

  // Friendly name
  friendlyName: string

  // Availability
  isAvailable: boolean

  // Actions
  start: () => void
  stop: () => void
  pause: () => void
  returnToBase: () => void
  locate: () => void
  setFanSpeed: (mode: FanSpeedMode) => void
  setMopIntensity: (level: MopIntensity) => void
  cleanSegment: (segmentId: number[]) => void
}

// Entity pattern matchers for Roborock vacuums (EN + DE patterns)
const VACUUM_PATTERNS = {
  // Battery and charging
  battery: [/sensor\..+_battery/i, /sensor\..+_batterie/i, /vacuum\..+/i],
  charging: [/binary_sensor\..+_charging/i, /binary_sensor\..+_ladestatus/i],

  // Fan speed
  fanSpeed: [/select\..+_fan_speed/i, /sensor\..+_fan_speed/i, /select\..+_saugstarke/i],

  // Mop intensity
  mopIntensity: [/select\..+_mop_intensity/i, /select\..+_mop_mode/i, /sensor\..+_mop_intensity/i, /select\..+_wisch_intensitat/i, /select\..+_mopp_modus/i],

  // Last cleaning stats (DE: ohne "gesamt" Prefix)
  lastCleanArea: [/sensor\..+_last_clean_area/i, /sensor\..+_cleaning_area/i, /sensor\..+(?<!gesamter_)reinigungsbereich/i],
  lastCleanDuration: [/sensor\..+_last_clean_duration/i, /sensor\..+_cleaning_time/i, /sensor\..+(?<!gesamt)reinigungszeit$/i],
  lastCleanStart: [/sensor\..+_last_clean_start/i, /sensor\..+_letzter_reinigungsbeginn/i],
  lastCleanEnd: [/sensor\..+_last_clean_end/i, /sensor\..+_letztes_reinigungsende/i],

  // Total stats (DE: mit "gesamt" Prefix)
  totalCleanArea: [/sensor\..+_total_clean_area/i, /sensor\..+_total_cleaning_area/i, /sensor\..+_gesamter_reinigungsbereich/i],
  totalCleanCount: [/sensor\..+_total_clean_count/i, /sensor\..+_total_cleaning_count/i, /sensor\..+_gesamtzahl_reinigung/i],
  totalCleanTime: [/sensor\..+_total_clean_time/i, /sensor\..+_total_cleaning_time/i, /sensor\..+_total_duration/i, /sensor\..+_gesamtreinigungszeit/i],

  // Consumables (DE: verbleibende_*)
  mainBrush: [/sensor\..+_main_brush_left/i, /sensor\..+_main_brush_remaining/i, /sensor\..+_verbleibende_zeit_der_hauptb/i],
  sideBrush: [/sensor\..+_side_brush_left/i, /sensor\..+_side_brush_remaining/i, /sensor\..+_verbleibende_zeit_der_seitenb/i],
  filter: [/sensor\..+_filter_left/i, /sensor\..+_filter_remaining/i, /sensor\..+_verbleibende_filterzeit/i],
  sensor: [/sensor\..+_sensor_left/i, /sensor\..+_sensor_dirty_left/i, /sensor\..+_verbleibende_sensorzeit/i],

  // Map
  map: [/camera\..+_map/i, /image\..+_map/i, /image\.roborock_s7/i],

  // Buttons
  locateButton: [/button\..+_locate/i, /button\..+_find/i, /button\..+_finden/i],
}

function mapVacuumStatus(state: string | undefined): VacuumStatus {
  if (!state || state === 'unavailable' || state === 'unknown') return 'unknown'

  const s = state.toLowerCase()

  if (s === 'docked' || s === 'charging') return 'docked'
  if (s === 'idle' || s === 'standby') return 'idle'
  if (s === 'cleaning' || s === 'segment_cleaning' || s === 'spot_cleaning' || s === 'zone_cleaning') return 'cleaning'
  if (s === 'paused') return 'paused'
  if (s === 'returning' || s === 'returning_home' || s === 'going_to_target') return 'returning'
  if (s === 'error' || s.includes('error') || s.includes('stuck')) return 'error'

  return 'idle'
}

function mapFanSpeed(state: string | undefined): FanSpeedMode {
  if (!state) return 'Standard'
  const s = state.toLowerCase()
  if (s.includes('silent') || s.includes('quiet') || s.includes('leise')) return 'Silent'
  if (s.includes('turbo') || s.includes('max')) return 'Turbo'
  if (s.includes('medium') || s.includes('mittel')) return 'Medium'
  return 'Standard'
}

function mapMopIntensity(state: string | undefined): MopIntensity {
  if (!state) return 'Medium'
  const s = state.toLowerCase()
  if (s === 'off' || s === 'aus' || s === 'none') return 'Off'
  if (s.includes('low') || s.includes('niedrig')) return 'Low'
  if (s.includes('high') || s.includes('hoch')) return 'High'
  return 'Medium'
}

// Standard consumable lifetimes in seconds for Roborock vacuums
const CONSUMABLE_MAX_SECONDS = {
  mainBrush: 300 * 3600,    // 300 hours = 1,080,000 seconds
  sideBrush: 200 * 3600,    // 200 hours = 720,000 seconds
  filter: 150 * 3600,       // 150 hours = 540,000 seconds
  sensor: 30 * 3600,        // 30 hours = 108,000 seconds
}

// Convert consumable value to percentage based on unit_of_measurement
function convertConsumableToPercent(
  value: number | null,
  unit: string | undefined,
  maxSeconds: number
): number | null {
  if (value === null) return null

  // If value is already a percentage (0-100 range and no time unit)
  if (value >= 0 && value <= 100 && !unit) {
    return value
  }

  // If unit indicates seconds (s, sec, seconds)
  if (unit === 's' || unit === 'sec' || unit === 'seconds' || unit === 'Sekunden') {
    return Math.min(100, Math.max(0, (value / maxSeconds) * 100))
  }

  // If unit indicates hours (h, hours, Stunden)
  if (unit === 'h' || unit === 'hours' || unit === 'Stunden') {
    const seconds = value * 3600
    return Math.min(100, Math.max(0, (seconds / maxSeconds) * 100))
  }

  // If unit indicates minutes (min, minutes, Minuten)
  if (unit === 'min' || unit === 'minutes' || unit === 'Minuten') {
    const seconds = value * 60
    return Math.min(100, Math.max(0, (seconds / maxSeconds) * 100))
  }

  // If value is very large (likely seconds without unit), convert from seconds
  if (value > 1000) {
    return Math.min(100, Math.max(0, (value / maxSeconds) * 100))
  }

  // Otherwise assume it's already a percentage
  return Math.min(100, Math.max(0, value))
}

// Convert time value to hours based on unit
function convertTimeToHours(value: number | null, unit: string | undefined): number | null {
  if (value === null) return null

  // If unit indicates minutes
  if (unit === 'min' || unit === 'minutes' || unit === 'Minuten') {
    return value / 60
  }

  // If unit indicates seconds
  if (unit === 's' || unit === 'sec' || unit === 'seconds' || unit === 'Sekunden') {
    return value / 3600
  }

  // If value is very large and no unit, likely minutes
  if (value > 10000 && !unit) {
    return value / 60
  }

  // Otherwise assume hours
  return value
}

export function useVacuumExtended(entityId: string): VacuumExtendedState {
  const { entities, callService, getEntity } = useHA()

  // Get main vacuum entity
  const vacuumEntity = getEntity(entityId)
  const attrs = vacuumEntity?.attributes || {}

  // Extract entity prefix for finding related sensors
  const entityPrefix = entityId.replace('vacuum.', '')

  // Find related entities
  const foundEntities = {
    battery: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.battery),
    fanSpeed: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.fanSpeed),
    mopIntensity: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.mopIntensity),
    lastCleanArea: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.lastCleanArea),
    lastCleanDuration: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.lastCleanDuration),
    lastCleanStart: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.lastCleanStart),
    lastCleanEnd: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.lastCleanEnd),
    totalCleanArea: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.totalCleanArea),
    totalCleanCount: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.totalCleanCount),
    totalCleanTime: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.totalCleanTime),
    mainBrush: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.mainBrush),
    sideBrush: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.sideBrush),
    filter: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.filter),
    sensor: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.sensor),
    map: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.map),
    locateButton: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.locateButton),
    charging: findEntityByPatterns(entities, entityPrefix, VACUUM_PATTERNS.charging),
  }

  // Get entity values
  const fanSpeedEntity = getEntity(foundEntities.fanSpeed || '')
  const mopIntensityEntity = getEntity(foundEntities.mopIntensity || '')
  const mapEntity = getEntity(foundEntities.map || '')
  const chargingEntity = getEntity(foundEntities.charging || '')

  // Parse status
  const status = mapVacuumStatus(vacuumEntity?.state)
  const statusText = vacuumEntity?.state || 'Unbekannt'

  // Battery from vacuum attributes or dedicated sensor
  const battery = (attrs.battery_level as number | undefined) ?? parseNumericState(getEntity(foundEntities.battery || ''))

  // Charging status
  const isCharging = chargingEntity?.state === 'on' || status === 'docked' && battery !== null && battery < 100

  // Fan speed
  const fanSpeed = mapFanSpeed(fanSpeedEntity?.state || (attrs.fan_speed as string | undefined))
  const fanSpeedList: FanSpeedMode[] = (fanSpeedEntity?.attributes?.options as string[] || attrs.fan_speed_list as string[] || ['Silent', 'Standard', 'Medium', 'Turbo'])
    .map(mapFanSpeed)
    .filter((v, i, a) => a.indexOf(v) === i) as FanSpeedMode[]

  // Mop intensity
  const mopIntensity = mapMopIntensity(mopIntensityEntity?.state || (attrs.mop_intensity as string | undefined))
  const mopIntensityList: MopIntensity[] = (mopIntensityEntity?.attributes?.options as string[] || ['Off', 'Low', 'Medium', 'High'])
    .map(mapMopIntensity)
    .filter((v, i, a) => a.indexOf(v) === i) as MopIntensity[]

  // Last cleaning stats
  const lastCleanArea = parseNumericState(getEntity(foundEntities.lastCleanArea || '')) ?? (attrs.last_clean_area as number | undefined) ?? null
  const lastCleanDuration = parseNumericState(getEntity(foundEntities.lastCleanDuration || '')) ?? (attrs.last_clean_time as number | undefined) ?? null

  const lastCleanStartEntity = getEntity(foundEntities.lastCleanStart || '')
  const lastCleanStart = lastCleanStartEntity?.state && lastCleanStartEntity.state !== 'unavailable'
    ? new Date(lastCleanStartEntity.state)
    : null

  const lastCleanEndEntity = getEntity(foundEntities.lastCleanEnd || '')
  const lastCleanEnd = lastCleanEndEntity?.state && lastCleanEndEntity.state !== 'unavailable'
    ? new Date(lastCleanEndEntity.state)
    : null

  // Total stats
  const totalCleanArea = parseNumericState(getEntity(foundEntities.totalCleanArea || '')) ?? (attrs.total_clean_area as number | undefined) ?? null
  const totalCleanCount = parseNumericState(getEntity(foundEntities.totalCleanCount || '')) ?? (attrs.total_clean_count as number | undefined) ?? null

  // Total clean time - convert to hours if needed
  const totalCleanTimeEntity = getEntity(foundEntities.totalCleanTime || '')
  const totalCleanTimeRaw = parseNumericState(totalCleanTimeEntity) ?? (attrs.total_clean_time as number | undefined) ?? null
  const totalCleanTimeUnit = totalCleanTimeEntity?.attributes?.unit_of_measurement as string | undefined
  const totalCleanTime = convertTimeToHours(totalCleanTimeRaw, totalCleanTimeUnit)

  // Consumables - get entities to check unit_of_measurement
  const mainBrushEntity = getEntity(foundEntities.mainBrush || '')
  const sideBrushEntity = getEntity(foundEntities.sideBrush || '')
  const filterEntity = getEntity(foundEntities.filter || '')
  const sensorEntity = getEntity(foundEntities.sensor || '')

  const mainBrushRaw = parseNumericState(mainBrushEntity) ?? (attrs.main_brush_left as number | undefined) ?? null
  const sideBrushRaw = parseNumericState(sideBrushEntity) ?? (attrs.side_brush_left as number | undefined) ?? null
  const filterRaw = parseNumericState(filterEntity) ?? (attrs.filter_left as number | undefined) ?? null
  const sensorRaw = parseNumericState(sensorEntity) ?? (attrs.sensor_dirty_left as number | undefined) ?? null

  // Convert to percentages based on unit
  const mainBrushLeft = convertConsumableToPercent(
    mainBrushRaw,
    mainBrushEntity?.attributes?.unit_of_measurement as string | undefined,
    CONSUMABLE_MAX_SECONDS.mainBrush
  )
  const sideBrushLeft = convertConsumableToPercent(
    sideBrushRaw,
    sideBrushEntity?.attributes?.unit_of_measurement as string | undefined,
    CONSUMABLE_MAX_SECONDS.sideBrush
  )
  const filterLeft = convertConsumableToPercent(
    filterRaw,
    filterEntity?.attributes?.unit_of_measurement as string | undefined,
    CONSUMABLE_MAX_SECONDS.filter
  )
  const sensorLeft = convertConsumableToPercent(
    sensorRaw,
    sensorEntity?.attributes?.unit_of_measurement as string | undefined,
    CONSUMABLE_MAX_SECONDS.sensor
  )

  // Map - build full URL for image entities with auth
  const mapEntityId = foundEntities.map
  let mapImageUrl: string | null = null

  if (mapEntity && mapEntity.state !== 'unavailable') {
    const entityPicture = mapEntity.attributes?.entity_picture as string | undefined
    const accessToken = mapEntity.attributes?.access_token as string | undefined

    if (entityPicture) {
      // If entity_picture is a relative path, prepend HA_URL
      if (entityPicture.startsWith('/')) {
        // Check if URL already has query params
        const separator = entityPicture.includes('?') ? '&' : '?'
        // Use entity's access_token if available, otherwise use global token
        const token = accessToken || HA_TOKEN
        mapImageUrl = token
          ? `${HA_URL}${entityPicture}${separator}token=${token}`
          : `${HA_URL}${entityPicture}`
      } else {
        mapImageUrl = entityPicture
      }
    } else if (mapEntityId?.startsWith('image.')) {
      // For image.* entities without entity_picture, use image proxy with auth
      const token = accessToken || HA_TOKEN
      mapImageUrl = token
        ? `${HA_URL}/api/image_proxy/${mapEntityId}?token=${token}`
        : `${HA_URL}/api/image_proxy/${mapEntityId}`
    }
  }

  const mapAvailable = mapEntity !== undefined && mapEntity.state !== 'unavailable' && mapImageUrl !== null

  // Friendly name
  const friendlyName = (attrs.friendly_name as string | undefined) || 'Staubsauger'

  // Availability
  const isAvailable = vacuumEntity !== undefined && vacuumEntity.state !== 'unavailable'

  // Actions
  const start = () => callService({
    domain: 'vacuum',
    service: 'start',
    target: { entity_id: entityId },
  })

  const stop = () => callService({
    domain: 'vacuum',
    service: 'stop',
    target: { entity_id: entityId },
  })

  const pause = () => callService({
    domain: 'vacuum',
    service: 'pause',
    target: { entity_id: entityId },
  })

  const returnToBase = () => callService({
    domain: 'vacuum',
    service: 'return_to_base',
    target: { entity_id: entityId },
  })

  const locate = () => {
    if (foundEntities.locateButton) {
      callService({
        domain: 'button',
        service: 'press',
        target: { entity_id: foundEntities.locateButton },
      })
    } else {
      callService({
        domain: 'vacuum',
        service: 'locate',
        target: { entity_id: entityId },
      })
    }
  }

  const setFanSpeed = (mode: FanSpeedMode) => {
    if (foundEntities.fanSpeed) {
      callService({
        domain: 'select',
        service: 'select_option',
        target: { entity_id: foundEntities.fanSpeed },
        service_data: { option: mode.toLowerCase() },
      })
    } else {
      callService({
        domain: 'vacuum',
        service: 'set_fan_speed',
        target: { entity_id: entityId },
        service_data: { fan_speed: mode.toLowerCase() },
      })
    }
  }

  const setMopIntensity = (level: MopIntensity) => {
    if (foundEntities.mopIntensity) {
      callService({
        domain: 'select',
        service: 'select_option',
        target: { entity_id: foundEntities.mopIntensity },
        service_data: { option: level.toLowerCase() },
      })
    }
  }

  const cleanSegment = (segmentIds: number[]) => {
    callService({
      domain: 'vacuum',
      service: 'send_command',
      target: { entity_id: entityId },
      service_data: {
        command: 'app_segment_clean',
        params: segmentIds,
      },
    })
  }

  return {
    status,
    statusText,
    battery,
    isCharging,
    fanSpeed,
    fanSpeedList: fanSpeedList.length > 0 ? fanSpeedList : ['Silent', 'Standard', 'Medium', 'Turbo'],
    mopIntensity,
    mopIntensityList: mopIntensityList.length > 0 ? mopIntensityList : ['Off', 'Low', 'Medium', 'High'],
    lastCleanArea,
    lastCleanDuration,
    lastCleanStart,
    lastCleanEnd,
    totalCleanArea,
    totalCleanCount,
    totalCleanTime,
    mainBrushLeft,
    sideBrushLeft,
    filterLeft,
    sensorLeft,
    mapImageUrl,
    mapAvailable,
    friendlyName,
    isAvailable,
    start,
    stop,
    pause,
    returnToBase,
    locate,
    setFanSpeed,
    setMopIntensity,
    cleanSegment,
  }
}

// Alarm/Wecker types and hook
export type AlarmMode = 'Automatisch' | 'Jeden Tag' | 'Nur Werktage' | 'Nur Wochenende' | 'Aus'

export interface AlarmState {
  isEnabled: boolean
  mode: AlarmMode
  weekdayTime: string | null // HH:MM format
  weekendTime: string | null
  standardTime: string | null
  nextAlarmTime: string | null
  nextAlarmLabel: string
  isAvailable: boolean

  // Actions
  setEnabled: (enabled: boolean) => void
  setMode: (mode: AlarmMode) => void
  setWeekdayTime: (time: string) => void
  setWeekendTime: (time: string) => void
  setStandardTime: (time: string) => void
}

function parseTimeFromEntity(entity: HassEntity | undefined): string | null {
  if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') {
    return null
  }
  // input_datetime can have state as HH:MM:SS or full datetime
  const state = entity.state
  if (state.includes(':')) {
    // Extract HH:MM
    const parts = state.split(':')
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  }
  return null
}

function isWeekday(): boolean {
  const day = new Date().getDay()
  return day >= 1 && day <= 5
}

function getNextAlarmInfo(
  isEnabled: boolean,
  mode: AlarmMode,
  weekdayTime: string | null,
  weekendTime: string | null,
  standardTime: string | null
): { time: string | null; label: string } {
  if (!isEnabled || mode === 'Aus') {
    return { time: null, label: 'Aus' }
  }

  const today = isWeekday()

  switch (mode) {
    case 'Jeden Tag':
      return { time: standardTime, label: 'Täglich' }
    case 'Nur Werktage':
      if (today) {
        return { time: weekdayTime, label: 'Heute (Werktag)' }
      }
      return { time: weekdayTime, label: 'Nächster Werktag' }
    case 'Nur Wochenende':
      if (!today) {
        return { time: weekendTime, label: 'Heute (Wochenende)' }
      }
      return { time: weekendTime, label: 'Nächstes Wochenende' }
    case 'Automatisch':
      if (today) {
        return { time: weekdayTime, label: 'Heute (Werktag)' }
      }
      return { time: weekendTime, label: 'Heute (Wochenende)' }
    default:
      return { time: null, label: 'Unbekannt' }
  }
}

export function useAlarm(): AlarmState {
  const { getEntity, callService } = useHA()

  const enabledEntity = getEntity('input_boolean.wecker_einschalten')
  const modeEntity = getEntity('input_select.wecker_modus')
  const weekdayEntity = getEntity('input_datetime.wecker_werktag')
  const weekendEntity = getEntity('input_datetime.wecker_wochenende')
  const standardEntity = getEntity('input_datetime.wecker')

  const isEnabled = enabledEntity?.state === 'on'
  const mode = (modeEntity?.state as AlarmMode) || 'Aus'
  const weekdayTime = parseTimeFromEntity(weekdayEntity)
  const weekendTime = parseTimeFromEntity(weekendEntity)
  const standardTime = parseTimeFromEntity(standardEntity)

  const { time: nextAlarmTime, label: nextAlarmLabel } = getNextAlarmInfo(
    isEnabled,
    mode,
    weekdayTime,
    weekendTime,
    standardTime
  )

  const isAvailable = enabledEntity !== undefined && modeEntity !== undefined

  const setEnabled = (enabled: boolean) => {
    callService({
      domain: 'input_boolean',
      service: enabled ? 'turn_on' : 'turn_off',
      target: { entity_id: 'input_boolean.wecker_einschalten' },
    })
  }

  const setMode = (newMode: AlarmMode) => {
    callService({
      domain: 'input_select',
      service: 'select_option',
      target: { entity_id: 'input_select.wecker_modus' },
      service_data: { option: newMode },
    })
  }

  const setWeekdayTime = (time: string) => {
    callService({
      domain: 'input_datetime',
      service: 'set_datetime',
      target: { entity_id: 'input_datetime.wecker_werktag' },
      service_data: { time },
    })
  }

  const setWeekendTime = (time: string) => {
    callService({
      domain: 'input_datetime',
      service: 'set_datetime',
      target: { entity_id: 'input_datetime.wecker_wochenende' },
      service_data: { time },
    })
  }

  const setStandardTime = (time: string) => {
    callService({
      domain: 'input_datetime',
      service: 'set_datetime',
      target: { entity_id: 'input_datetime.wecker' },
      service_data: { time },
    })
  }

  return {
    isEnabled,
    mode,
    weekdayTime,
    weekendTime,
    standardTime,
    nextAlarmTime,
    nextAlarmLabel,
    isAvailable,
    setEnabled,
    setMode,
    setWeekdayTime,
    setWeekendTime,
    setStandardTime,
  }
}

// Weather types and hook
export type WeatherCondition =
  | 'sunny'
  | 'clear-night'
  | 'cloudy'
  | 'partlycloudy'
  | 'rainy'
  | 'pouring'
  | 'snowy'
  | 'snowy-rainy'
  | 'hail'
  | 'lightning'
  | 'lightning-rainy'
  | 'fog'
  | 'windy'
  | 'windy-variant'
  | 'exceptional'
  | 'unknown'

export interface WeatherState {
  condition: WeatherCondition
  conditionLabel: string
  temperature: number | null
  humidity: number | null
  windSpeed: number | null
  pressure: number | null
  friendlyName: string
  isAvailable: boolean
}

const CONDITION_LABELS: Record<WeatherCondition, string> = {
  sunny: 'Sonnig',
  'clear-night': 'Klare Nacht',
  cloudy: 'Bewölkt',
  partlycloudy: 'Teilweise bewölkt',
  rainy: 'Regnerisch',
  pouring: 'Starkregen',
  snowy: 'Schnee',
  'snowy-rainy': 'Schneeregen',
  hail: 'Hagel',
  lightning: 'Gewitter',
  'lightning-rainy': 'Gewitter mit Regen',
  fog: 'Nebel',
  windy: 'Windig',
  'windy-variant': 'Windig',
  exceptional: 'Ungewöhnlich',
  unknown: 'Unbekannt',
}

export function useWeather(entityId: string): WeatherState {
  const { getEntity } = useHA()
  const entity = getEntity(entityId)
  const attrs = entity?.attributes || {}

  const rawCondition = entity?.state?.toLowerCase() || 'unknown'
  const condition = (Object.keys(CONDITION_LABELS).includes(rawCondition)
    ? rawCondition
    : 'unknown') as WeatherCondition

  return {
    condition,
    conditionLabel: CONDITION_LABELS[condition],
    temperature: typeof attrs.temperature === 'number' ? attrs.temperature : null,
    humidity: typeof attrs.humidity === 'number' ? attrs.humidity : null,
    windSpeed: typeof attrs.wind_speed === 'number' ? attrs.wind_speed : null,
    pressure: typeof attrs.pressure === 'number' ? attrs.pressure : null,
    friendlyName: (attrs.friendly_name as string) || 'Wetter',
    isAvailable: entity !== undefined && entity.state !== 'unavailable',
  }
}

// Waste collection types and hook
export type WasteType = 'restmuell' | 'gelber_sack' | 'papier' | 'unknown'

export interface WasteEvent {
  type: WasteType
  label: string
  rawSummary: string
  date: Date
  daysUntil: number
  isToday: boolean
  isTomorrow: boolean
  isSoon: boolean // within 2 days
}

export interface WasteCalendarState {
  events: WasteEvent[]
  nextPickup: WasteEvent | null
  hasSoonPickup: boolean
  isAvailable: boolean
}

function detectWasteType(message: string): WasteType {
  const lower = message.toLowerCase()
  if (lower.includes('restmüll') || lower.includes('restmull') || lower.includes('restabfall')) {
    return 'restmuell'
  }
  if (lower.includes('gelber') || lower.includes('wertstoff') || lower.includes('verpackung')) {
    return 'gelber_sack'
  }
  if (lower.includes('papier') || lower.includes('altpapier') || lower.includes('pappe')) {
    return 'papier'
  }
  return 'unknown'
}

function getWasteLabel(type: WasteType, rawSummary: string): string {
  switch (type) {
    case 'restmuell':
      return 'Restmüll'
    case 'gelber_sack':
      return 'Gelber Sack'
    case 'papier':
      return 'Papier'
    default:
      // Use original summary for unknown types
      return rawSummary
  }
}

function parseCalendarDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

function calculateDaysUntil(date: Date): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function useWasteCalendar(entityId: string): WasteCalendarState {
  const { getEntity } = useHA()
  const entity = getEntity(entityId)
  const attrs = entity?.attributes || {}

  const events: WasteEvent[] = []

  // Home Assistant calendar entities have these attributes:
  // - message: Event summary/title
  // - start_time: Start date/time
  // - all_day: boolean
  // - description: optional description

  // For calendar entities, the state is usually 'on' (event today) or 'off' (no event today)
  // The attributes contain the next upcoming event

  if (entity && entity.state !== 'unavailable') {
    const message = (attrs.message as string) || ''
    const startTime = attrs.start_time as string | undefined

    if (message && startTime) {
      const date = parseCalendarDate(startTime)
      if (date) {
        const daysUntil = calculateDaysUntil(date)
        const type = detectWasteType(message)

        events.push({
          type,
          label: getWasteLabel(type, message),
          rawSummary: message,
          date,
          daysUntil,
          isToday: daysUntil === 0,
          isTomorrow: daysUntil === 1,
          isSoon: daysUntil <= 2 && daysUntil >= 0,
        })
      }
    }
  }

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Filter to only future events (or today)
  const upcomingEvents = events.filter((e) => e.daysUntil >= 0)

  return {
    events: upcomingEvents,
    nextPickup: upcomingEvents[0] || null,
    hasSoonPickup: upcomingEvents.some((e) => e.isSoon),
    isAvailable: entity !== undefined && entity.state !== 'unavailable',
  }
}

export function usePrinter(entityPrefix: string): PrinterState {
  const { entities, callService, getEntity } = useHA()

  // Find entities matching our patterns
  const foundEntities = {
    nozzleTemp: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.nozzleTemp),
    nozzleTargetTemp: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.nozzleTargetTemp),
    bedTemp: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.bedTemp),
    bedTargetTemp: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.bedTargetTemp),
    chamberTemp: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.chamberTemp),
    status: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.status),
    progress: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.progress),
    currentLayer: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.currentLayer),
    totalLayers: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.totalLayers),
    remainingTime: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.remainingTime),
    jobName: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.jobName),
    printStage: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.printStage),
    startTime: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.startTime),
    endTime: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.endTime),
    speedMode: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.speedMode),
    printSpeed: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.printSpeed),
    auxFan: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.auxFan),
    chamberFan: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.chamberFan),
    coolingFan: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.coolingFan),
    amsHumidity: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.amsHumidity),
    amsTemp: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.amsTemp),
    amsDrying: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.amsDrying),
    activeTray: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.activeTray),
    camera: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.camera),
    hms: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.hms),
    firmware: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.firmware),
    chamberLight: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.chamberLight),
    roomLight: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.roomLight),
    pauseButton: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.pauseButton),
    resumeButton: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.resumeButton),
    stopButton: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.stopButton),
    nozzleTempInput: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.nozzleTempInput),
    bedTempInput: findEntityByPatterns(entities, entityPrefix, PRINTER_PATTERNS.bedTempInput),
  }

  // Get entity states
  const statusEntity = getEntity(foundEntities.status || '')
  const chamberLightEntity = getEntity(foundEntities.chamberLight || '')
  const roomLightEntity = getEntity(foundEntities.roomLight || '')
  const jobNameEntity = getEntity(foundEntities.jobName || '')
  const printStageEntity = getEntity(foundEntities.printStage || '')
  const speedModeEntity = getEntity(foundEntities.speedMode || '')
  const hmsEntity = getEntity(foundEntities.hms || '')
  const firmwareEntity = getEntity(foundEntities.firmware || '')
  const cameraEntity = getEntity(foundEntities.camera || '')
  const activeTrayEntity = getEntity(foundEntities.activeTray || '')

  // Parse temperature values - check both sensor and attributes
  let nozzleTemp = parseNumericState(getEntity(foundEntities.nozzleTemp || ''))
  let nozzleTargetTemp = parseNumericState(getEntity(foundEntities.nozzleTargetTemp || ''))
  let bedTemp = parseNumericState(getEntity(foundEntities.bedTemp || ''))
  let bedTargetTemp = parseNumericState(getEntity(foundEntities.bedTargetTemp || ''))

  // For Bambu Lab, targets might be in attributes of the temperature sensor
  const nozzleTempEntity = getEntity(foundEntities.nozzleTemp || '')
  const bedTempEntity = getEntity(foundEntities.bedTemp || '')

  if (nozzleTempEntity?.attributes?.target !== undefined) {
    nozzleTargetTemp = nozzleTempEntity.attributes.target as number
  }
  if (bedTempEntity?.attributes?.target !== undefined) {
    bedTargetTemp = bedTempEntity.attributes.target as number
  }

  const status = mapPrinterStatus(statusEntity?.state)

  // Determine availability - if we have any temperature reading, printer is available
  const isAvailable = nozzleTemp !== null || bedTemp !== null || statusEntity?.state !== 'unavailable'

  // Get friendly name from any available entity
  const statusFriendlyName = statusEntity?.attributes?.friendly_name as string | undefined
  const nozzleFriendlyName = nozzleTempEntity?.attributes?.friendly_name as string | undefined
  const friendlyName =
    statusFriendlyName?.replace(/ (Status|Stage|Current Stage)$/i, '') ||
    nozzleFriendlyName?.replace(/ (Nozzle|Düse).*$/i, '') ||
    'Bambu Lab Drucker'

  // Parse fan speeds
  const auxFanSpeed = parseNumericState(getEntity(foundEntities.auxFan || ''))
  const chamberFanSpeed = parseNumericState(getEntity(foundEntities.chamberFan || ''))
  const coolingFanSpeed = parseNumericState(getEntity(foundEntities.coolingFan || ''))

  // Build fans array
  const fans: FanData[] = []
  if (foundEntities.auxFan) {
    fans.push({
      id: 'aux',
      label: 'Hilfsventilator',
      type: 'aux',
      speed: auxFanSpeed,
      isOn: auxFanSpeed !== null && auxFanSpeed > 0,
      entityId: foundEntities.auxFan,
      canControl: foundEntities.auxFan.startsWith('fan.'),
    })
  }
  if (foundEntities.chamberFan) {
    fans.push({
      id: 'chamber',
      label: 'Kammerventilator',
      type: 'chamber',
      speed: chamberFanSpeed,
      isOn: chamberFanSpeed !== null && chamberFanSpeed > 0,
      entityId: foundEntities.chamberFan,
      canControl: foundEntities.chamberFan.startsWith('fan.'),
    })
  }
  if (foundEntities.coolingFan) {
    fans.push({
      id: 'cooling',
      label: 'Kühlung',
      type: 'cooling',
      speed: coolingFanSpeed,
      isOn: coolingFanSpeed !== null && coolingFanSpeed > 0,
      entityId: foundEntities.coolingFan,
      canControl: foundEntities.coolingFan.startsWith('fan.'),
    })
  }

  // Build AMS data (simplified - detect any AMS-related entities)
  const amsUnits: AMSUnitData[] = []
  const amsHumidityEntity = getEntity(foundEntities.amsHumidity || '')
  const amsTempEntity = getEntity(foundEntities.amsTemp || '')
  const amsDryingEntity = getEntity(foundEntities.amsDrying || '')

  // If we have any AMS entity, create a unit
  if (amsHumidityEntity || amsTempEntity) {
    // Try to find tray information from entity attributes or separate entities
    const trays: AMSTrayData[] = []

    // Look for tray-related entities
    for (let slot = 1; slot <= 4; slot++) {
      const trayPattern = new RegExp(`tray_?${slot}|slot_?${slot}`, 'i')
      const trayEntities = findAllEntitiesByPattern(entities, entityPrefix, trayPattern)

      let material: string | null = null
      let colorHex: string | null = null
      let remaining: number | null = null

      for (const trayEntityId of trayEntities) {
        const trayEntity = getEntity(trayEntityId)
        if (!trayEntity) continue

        if (trayEntityId.includes('material') || trayEntityId.includes('type')) {
          material = trayEntity.state !== 'unavailable' ? trayEntity.state : null
        }
        if (trayEntityId.includes('color')) {
          colorHex = trayEntity.state !== 'unavailable' ? trayEntity.state : null
        }
        if (trayEntityId.includes('remaining') || trayEntityId.includes('level')) {
          remaining = parseNumericState(trayEntity)
        }
      }

      // Check if this tray is active
      const isActive = activeTrayEntity?.state?.includes(String(slot)) || false

      trays.push({
        slot,
        material,
        color: material,
        colorHex,
        remaining,
        isActive,
        isEmpty: !material || material === 'empty' || material === 'unknown',
      })
    }

    amsUnits.push({
      id: 1,
      name: 'AMS',
      trays: trays.length > 0 ? trays : [
        { slot: 1, material: null, color: null, colorHex: null, remaining: null, isActive: false, isEmpty: true },
        { slot: 2, material: null, color: null, colorHex: null, remaining: null, isActive: false, isEmpty: true },
        { slot: 3, material: null, color: null, colorHex: null, remaining: null, isActive: false, isEmpty: true },
        { slot: 4, material: null, color: null, colorHex: null, remaining: null, isActive: false, isEmpty: true },
      ],
      humidity: parseNumericState(amsHumidityEntity),
      humidityIndex: null,
      temperature: parseNumericState(amsTempEntity),
      drying: amsDryingEntity?.state === 'on',
      dryingTime: null,
    })
  }

  // Camera URL
  const cameraUrl = cameraEntity?.attributes?.entity_picture as string | null || null
  const cameraAvailable = cameraEntity !== undefined && cameraEntity.state !== 'unavailable'

  // Actions
  const toggleChamberLight = () => {
    if (foundEntities.chamberLight) {
      callService({
        domain: 'light',
        service: 'toggle',
        target: { entity_id: foundEntities.chamberLight },
      })
    }
  }

  const toggleRoomLight = () => {
    if (foundEntities.roomLight) {
      callService({
        domain: 'light',
        service: 'toggle',
        target: { entity_id: foundEntities.roomLight },
      })
    }
  }

  const pausePrint = () => {
    if (foundEntities.pauseButton) {
      callService({
        domain: 'button',
        service: 'press',
        target: { entity_id: foundEntities.pauseButton },
      })
    }
  }

  const resumePrint = () => {
    if (foundEntities.resumeButton) {
      callService({
        domain: 'button',
        service: 'press',
        target: { entity_id: foundEntities.resumeButton },
      })
    }
  }

  const stopPrint = () => {
    if (foundEntities.stopButton) {
      callService({
        domain: 'button',
        service: 'press',
        target: { entity_id: foundEntities.stopButton },
      })
    }
  }

  const setFanSpeed = (fanId: string, speed: number) => {
    const fan = fans.find(f => f.id === fanId)
    if (fan?.entityId && fan.canControl) {
      callService({
        domain: 'fan',
        service: 'set_percentage',
        target: { entity_id: fan.entityId },
        service_data: { percentage: speed },
      })
    }
  }

  const setSpeedMode = (mode: SpeedMode) => {
    if (foundEntities.speedMode) {
      callService({
        domain: 'select',
        service: 'select_option',
        target: { entity_id: foundEntities.speedMode },
        service_data: { option: mode },
      })
    }
  }

  const setNozzleTemp = (temp: number) => {
    if (foundEntities.nozzleTempInput) {
      callService({
        domain: 'number',
        service: 'set_value',
        target: { entity_id: foundEntities.nozzleTempInput },
        service_data: { value: temp },
      })
    }
  }

  const setBedTemp = (temp: number) => {
    if (foundEntities.bedTempInput) {
      callService({
        domain: 'number',
        service: 'set_value',
        target: { entity_id: foundEntities.bedTempInput },
        service_data: { value: temp },
      })
    }
  }

  return {
    status,
    statusText: statusEntity?.state || 'Unbekannt',
    printStage: printStageEntity?.state || null,
    nozzleTemp,
    nozzleTargetTemp,
    bedTemp,
    bedTargetTemp,
    chamberTemp: parseNumericState(getEntity(foundEntities.chamberTemp || '')),
    printProgress: parseNumericState(getEntity(foundEntities.progress || '')),
    currentLayer: parseNumericState(getEntity(foundEntities.currentLayer || '')),
    totalLayers: parseNumericState(getEntity(foundEntities.totalLayers || '')),
    remainingTime: parseNumericState(getEntity(foundEntities.remainingTime || '')),
    jobName: jobNameEntity?.state !== 'unavailable' && jobNameEntity?.state !== 'unknown'
      ? jobNameEntity?.state || null
      : null,
    startTime: parseDateTime(getEntity(foundEntities.startTime || '')),
    endTime: parseDateTime(getEntity(foundEntities.endTime || '')),
    speedMode: mapSpeedMode(speedModeEntity?.state),
    printSpeed: parseNumericState(getEntity(foundEntities.printSpeed || '')),
    fans,
    auxFanSpeed,
    chamberFanSpeed,
    coolingFanSpeed,
    amsUnits,
    activeTray: activeTrayEntity?.state || null,
    activeTrayColor: activeTrayEntity?.attributes?.color as string | null || null,
    cameraUrl,
    cameraAvailable,
    hmsNotifications: hmsEntity?.state !== 'unavailable' && hmsEntity?.state !== 'unknown'
      ? hmsEntity?.state || null
      : null,
    firmwareVersion: firmwareEntity?.state !== 'unavailable'
      ? firmwareEntity?.state || null
      : null,
    chamberLightEntity: foundEntities.chamberLight,
    chamberLightOn: chamberLightEntity?.state === 'on',
    roomLightEntity: foundEntities.roomLight,
    roomLightOn: roomLightEntity?.state === 'on',
    isAvailable,
    friendlyName,
    toggleChamberLight,
    toggleRoomLight,
    pausePrint,
    resumePrint,
    stopPrint,
    setFanSpeed,
    setSpeedMode,
    setNozzleTemp,
    setBedTemp,
  }
}
