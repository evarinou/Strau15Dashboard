import { Link } from 'react-router-dom'
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
  ArrowUpRight,
  Lightbulb,
  Power,
} from 'lucide-react'
import { clsx } from 'clsx'
import { GlassPanel } from '../components/ui/GlassPanel'
import { meshStyle } from '../lib/mesh'
import { useDaylightPhase } from '../contexts/DaylightContext'
import { useRooms } from '../hooks/useChoreQuest'
import { useHA } from '../contexts/HomeAssistantContext'
import { ROOM_LIGHTS, ROOM_SWITCH_LIGHTS, LIGHT_NAMES, type SwitchLight } from '../config/entities'

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

export function Rooms() {
  const { data: rooms = [], isLoading } = useRooms()
  const { entities, callService } = useHA()
  const phase = useDaylightPhase()
  const onDark = phase === 'nacht'

  const getAreaDevices = (areaId: string | null) => {
    if (!areaId) return { lights: [] as string[], switches: [] as SwitchLight[] }
    return { lights: ROOM_LIGHTS[areaId] || [], switches: ROOM_SWITCH_LIGHTS[areaId] || [] }
  }

  const getDeviceCounts = (areaId: string | null) => {
    const { lights, switches } = getAreaDevices(areaId)
    const allIds = [...lights, ...switches.map((s) => s.id)]
    const onCount = allIds.filter((id) => entities.get(id)?.state === 'on').length
    return { total: allIds.length, on: onCount }
  }

  const toggleDevice = (entityId: string) => {
    const entity = entities.get(entityId)
    if (!entity) return
    const domain = entityId.split('.')[0]
    const service = entity.state === 'on' ? 'turn_off' : 'turn_on'
    callService({ domain, service, target: { entity_id: entityId } })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-ink">
          Räume
        </h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-white/35 animate-shimmer r-panel" />
          ))}
        </div>
      </div>
    )
  }

  const visibleRooms = rooms
    .filter((room) => room.ha_area_id !== 'wecker')
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-ink">
          Räume
        </h1>
        <p className="text-text-secondary mt-1">{visibleRooms.length} Räume</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleRooms.map((room) => {
          const Icon = roomIcons[room.ha_area_id || ''] || DoorOpen
          const seed = room.ha_area_id || String(room.id)
          const { lights, switches } = getAreaDevices(room.ha_area_id)
          const counts = getDeviceCounts(room.ha_area_id)

          return (
            <GlassPanel key={room.id} padding="none" className="overflow-hidden flex flex-col">
              {/* Mesh-Kopf: klickbar, führt in den Raum. Seed = ha_area_id,
                  also hat jeder Raum für immer dieselbe Farbe. */}
              <Link
                to={`/room/${room.ha_area_id || room.id}`}
                className="group relative block h-28 shrink-0"
              >
                <div
                  className="mesh-tile absolute inset-0"
                  style={meshStyle(seed, phase)}
                  aria-hidden="true"
                />
                {onDark && (
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(transparent 45%, var(--scrim))' }}
                    aria-hidden="true"
                  />
                )}

                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span
                      className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center',
                        onDark ? 'bg-white/20 text-white' : 'bg-white/55 text-ink'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span
                      className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-110',
                        onDark ? 'bg-white/25 text-white' : 'bg-white/70 text-ink shadow-pill'
                      )}
                      aria-hidden="true"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>

                  <div>
                    <p
                      className={clsx(
                        'font-display font-bold text-lg leading-tight',
                        onDark ? 'text-white' : 'text-ink'
                      )}
                    >
                      {room.name}
                    </p>
                    {counts.total > 0 && (
                      <p className={clsx('text-xs', onDark ? 'text-white/75' : 'text-ink/70')}>
                        {counts.on > 0 ? `${counts.on}/${counts.total} an` : 'Alles aus'}
                      </p>
                    )}
                  </div>
                </div>
              </Link>

              {/* Schnell-Schalter: direkt bedienbar, ohne den Raum zu öffnen */}
              {counts.total > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3">
                  {lights.map((entityId) => {
                    const isOn = entities.get(entityId)?.state === 'on'
                    const name = LIGHT_NAMES[entityId] || entityId.split('.')[1]
                    return (
                      <button
                        key={entityId}
                        onClick={() => toggleDevice(entityId)}
                        className={clsx(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          'transition-all duration-200 active:scale-95',
                          isOn
                            ? 'bg-warning/20 text-warning'
                            : 'glass-inset text-text-secondary hover:text-ink'
                        )}
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span>{name}</span>
                      </button>
                    )
                  })}

                  {switches.map(({ id, shortLabel: label }) => {
                    const isOn = entities.get(id)?.state === 'on'
                    return (
                      <button
                        key={id}
                        onClick={() => toggleDevice(id)}
                        className={clsx(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          'transition-all duration-200 active:scale-95',
                          isOn
                            ? 'bg-accent/15 text-accent'
                            : 'glass-inset text-text-secondary hover:text-ink'
                        )}
                      >
                        <Power className="w-3 h-3" />
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </GlassPanel>
          )
        })}
      </div>
    </div>
  )
}
