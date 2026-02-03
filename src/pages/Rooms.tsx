import { NavLink } from 'react-router-dom'
import {
  Sofa,
  UtensilsCrossed,
  Bed,
  Bath,
  BookOpen,
  Hammer,
  Sun,
  Printer,
  DoorOpen,
  ChevronRight,
  Lightbulb,
  Power,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../components/ui/Card'
import { useRooms } from '../hooks/useChoreQuest'
import { useHA } from '../contexts/HomeAssistantContext'

const roomIcons: Record<string, typeof Sofa> = {
  wohnzimmer: Sofa,
  kuche: UtensilsCrossed,
  schlafzimmer: Bed,
  bad: Bath,
  bucherzimmer: BookOpen,
  werkstatt: Hammer,
  innenhof: Sun,
  '3d_drucker_zimmer': Printer,
  ankleide: DoorOpen,
  lukas_buro: DoorOpen,
  esszimmer: UtensilsCrossed,
}

// Map area IDs to light entities
const ROOM_LIGHTS: Record<string, string[]> = {
  wohnzimmer: ['light.blumenlampe', 'light.mondschein'],
  schlafzimmer: ['light.doppellampe', 'light.lampeecke'],
  bad: ['light.tasmota_waschtisch', 'light.badezimmerd1'],
  bucherzimmer: ['light.sonoff_bucherzimmer', 'light.hue_filament_bulb'],
  innenhof: ['light.sonoff_innenhof'],
  '3d_drucker_zimmer': ['light.a1_03919d4b2001225_druckraumbeleuchtung'],
}

// Map area IDs to switch-based lights/devices
const ROOM_SWITCHES: Record<string, { id: string; label: string }[]> = {
  ankleide: [{ id: 'switch.sonoff_ankleide_ankleide', label: 'Decke' }],
  esszimmer: [{ id: 'switch.sonoff_esszimmer_esszimmer', label: 'Decke' }],
  kuche: [{ id: 'switch.sonoff_kueche_kueche', label: 'Decke' }],
  schlafzimmer: [
    { id: 'switch.sonoff_schlafzimmer_schlafzimmer', label: 'Decke' },
    { id: 'switch.0xec1bbdfffefd3660', label: 'Steckdose' },
  ],
  bucherzimmer: [{ id: 'switch.steckdosenswitch_buchzimmer', label: 'Steckdose' }],
  wohnzimmer: [{ id: 'switch.steckdose_wohnzimmer', label: 'Steckdose' }],
  lukas_buro: [{ id: 'switch.0xb4e3f9fffec0451b', label: 'Schreibtisch' }],
  '3d_drucker_zimmer': [{ id: 'switch.0x5c0272fffe7f9e5c', label: 'Drucker' }],
}

// Friendly names for lights
const LIGHT_NAMES: Record<string, string> = {
  'light.doppellampe': 'Doppel',
  'light.blumenlampe': 'Blume',
  'light.mondschein': 'Mond',
  'light.lampeecke': 'Ecke',
  'light.tasmota_waschtisch': 'Wasch',
  'light.badezimmerd1': 'Decke',
  'light.sonoff_bucherzimmer': 'Sonoff',
  'light.hue_filament_bulb': 'Hue',
  'light.sonoff_innenhof': 'Hof',
  'light.a1_03919d4b2001225_druckraumbeleuchtung': 'Licht',
}

export function Rooms() {
  const { data: rooms = [], isLoading } = useRooms()
  const { entities, callService } = useHA()

  // Get all devices (lights + switches) for an area
  const getAreaDevices = (areaId: string | null) => {
    if (!areaId) return { lights: [] as string[], switches: [] as { id: string; label: string }[] }

    const lights = ROOM_LIGHTS[areaId] || []
    const switches = ROOM_SWITCHES[areaId] || []

    return { lights, switches }
  }

  // Get device counts
  const getDeviceCounts = (areaId: string | null) => {
    const { lights, switches } = getAreaDevices(areaId)
    const allIds = [...lights, ...switches.map(s => s.id)]

    const onCount = allIds.filter(id => entities.get(id)?.state === 'on').length
    return { total: allIds.length, on: onCount }
  }

  // Toggle a single device
  const toggleDevice = (entityId: string) => {
    const entity = entities.get(entityId)
    if (!entity) return

    const domain = entityId.split('.')[0]
    const service = entity.state === 'on' ? 'turn_off' : 'turn_on'

    callService({
      domain,
      service,
      target: { entity_id: entityId },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Räume</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-surface-elevated animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Räume</h1>
        <p className="text-text-secondary">{rooms.length} Räume</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms
          .filter((room) => room.ha_area_id !== 'wecker')
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((room) => {
            const Icon = roomIcons[room.ha_area_id || ''] || DoorOpen
            const { lights, switches } = getAreaDevices(room.ha_area_id)
            const counts = getDeviceCounts(room.ha_area_id)

            return (
              <NavLink key={room.id} to={`/room/${room.ha_area_id || room.id}`}>
                <Card variant="interactive" className="h-full">
                  <div className="flex items-center gap-3">
                    {/* Room icon */}
                    <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>

                    {/* Room name and status */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{room.name}</p>
                      {counts.total > 0 && (
                        <p className="text-xs text-text-secondary">
                          {counts.on > 0 ? (
                            <span className="text-warning">{counts.on}/{counts.total} an</span>
                          ) : (
                            'Alles aus'
                          )}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  </div>

                  {/* Device buttons row */}
                  {counts.total > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/30">
                      {/* Lights */}
                      {lights.map((entityId) => {
                        const entity = entities.get(entityId)
                        const isOn = entity?.state === 'on'
                        const name = LIGHT_NAMES[entityId] || entityId.split('.')[1]

                        return (
                          <button
                            key={entityId}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleDevice(entityId)
                            }}
                            className={clsx(
                              'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                              'transition-all duration-200 hover:scale-105 active:scale-95',
                              isOn
                                ? 'bg-warning/20 text-warning'
                                : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                            )}
                            style={{
                              boxShadow: isOn ? '0 0 8px oklch(0.769 0.188 70.08 / 0.3)' : 'none',
                            }}
                          >
                            <Lightbulb className="w-3 h-3" />
                            <span>{name}</span>
                          </button>
                        )
                      })}

                      {/* Switches */}
                      {switches.map(({ id, label }) => {
                        const entity = entities.get(id)
                        const isOn = entity?.state === 'on'

                        return (
                          <button
                            key={id}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleDevice(id)
                            }}
                            className={clsx(
                              'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                              'transition-all duration-200 hover:scale-105 active:scale-95',
                              isOn
                                ? 'bg-accent/20 text-accent'
                                : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                            )}
                            style={{
                              boxShadow: isOn ? '0 0 8px oklch(0.623 0.214 259.13 / 0.3)' : 'none',
                            }}
                          >
                            <Power className="w-3 h-3" />
                            <span>{label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </NavLink>
            )
          })}
      </div>
    </div>
  )
}
