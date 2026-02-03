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
} from 'lucide-react'
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

export function Rooms() {
  const { data: rooms = [], isLoading } = useRooms()
  const { entities } = useHA()

  // Get light counts per area
  const getLightCount = (areaId: string | null) => {
    if (!areaId) return { total: 0, on: 0 }

    const areaLights = Array.from(entities.values()).filter((e) => {
      if (!e.entity_id.startsWith('light.')) return false
      // Check if entity name contains area name
      const name = e.entity_id.toLowerCase()
      return name.includes(areaId.replace('_', ''))
    })

    return {
      total: areaLights.length,
      on: areaLights.filter((l) => l.state === 'on').length,
    }
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
            const lights = getLightCount(room.ha_area_id)

            return (
              <NavLink key={room.id} to={`/room/${room.ha_area_id || room.id}`}>
                <Card variant="interactive" className="h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{room.name}</p>
                      {lights.total > 0 && (
                        <p className="text-sm text-text-secondary">
                          {lights.on > 0 ? (
                            <span className="text-warning">{lights.on} Licht{lights.on > 1 ? 'er' : ''} an</span>
                          ) : (
                            'Alles aus'
                          )}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-secondary" />
                  </div>
                </Card>
              </NavLink>
            )
          })}
      </div>
    </div>
  )
}
