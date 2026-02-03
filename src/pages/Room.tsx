import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { LightWidget, SwitchLightWidget, MediaWidget, TaskWidget, PrinterDashboard, VacuumDashboard, AlarmWidget, MusicBanner } from '../components/widgets'
import { useRooms, useTodayInstances } from '../hooks/useChoreQuest'
import { useHA, useMediaPlayer } from '../contexts/HomeAssistantContext'

// Map area IDs to light entities (light.*)
const ROOM_LIGHTS: Record<string, string[]> = {
  wohnzimmer: ['light.blumenlampe', 'light.mondschein'],
  schlafzimmer: ['light.doppellampe', 'light.lampeecke'],
  bad: ['light.tasmota_waschtisch', 'light.badezimmerd1'],
  bucherzimmer: ['light.sonoff_bucherzimmer', 'light.hue_filament_bulb'],
  innenhof: ['light.sonoff_innenhof'],
  '3d_drucker_zimmer': ['light.a1_03919d4b2001225_druckraumbeleuchtung'],
}

// Map area IDs to switch-based lights
const ROOM_SWITCH_LIGHTS: Record<string, { id: string; label: string }[]> = {
  ankleide: [{ id: 'switch.sonoff_ankleide_ankleide', label: 'Deckenlampe' }],
  esszimmer: [{ id: 'switch.sonoff_esszimmer_esszimmer', label: 'Deckenlampe' }],
  kuche: [{ id: 'switch.sonoff_kueche_kueche', label: 'Deckenlampe' }],
  schlafzimmer: [
    { id: 'switch.sonoff_schlafzimmer_schlafzimmer', label: 'Deckenlampe' },
    { id: 'switch.0xec1bbdfffefd3660', label: 'Steckdosenlampe' },
  ],
  bucherzimmer: [{ id: 'switch.steckdosenswitch_buchzimmer', label: 'Steckdosenlampe' }],
  wohnzimmer: [{ id: 'switch.steckdose_wohnzimmer', label: 'Steckdosenlampe' }],
  lukas_buro: [{ id: 'switch.0xb4e3f9fffec0451b', label: 'Schreibtisch' }],
  '3d_drucker_zimmer': [{ id: 'switch.0x5c0272fffe7f9e5c', label: '3D-Drucker Strom' }],
}

// Map area IDs to media players
const ROOM_MEDIA: Record<string, string> = {
  wohnzimmer: 'media_player.wohnzimmer',
  kuche: 'media_player.kuche',
  schlafzimmer: 'media_player.schlafzimmer',
  bad: 'media_player.bad',
  bucherzimmer: 'media_player.bucherzimmer',
}

export function Room() {
  const { areaId } = useParams<{ areaId: string }>()
  const { data: rooms = [] } = useRooms()
  const { data: instances = [] } = useTodayInstances()
  const { entities } = useHA()

  const room = rooms.find((r) => r.ha_area_id === areaId || String(r.id) === areaId)
  const lights = ROOM_LIGHTS[areaId || ''] || []
  const switchLights = ROOM_SWITCH_LIGHTS[areaId || ''] || []
  const mediaPlayer = ROOM_MEDIA[areaId || '']

  // Get media player state for the banner
  const mediaState = useMediaPlayer(mediaPlayer || '')
  const showMusicBanner = mediaPlayer && (mediaState.isPlaying || mediaState.isPaused) && !mediaState.isUnavailable

  // Get tasks for this room
  const roomTasks = instances.filter(
    (i) => i.task.room_id === room?.id && i.status === 'pending'
  )

  const totalLights = lights.length + switchLights.length

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Raum nicht gefunden</p>
        <Link to="/rooms" className="text-accent hover:underline">
          Zurück zu Räume
        </Link>
      </div>
    )
  }

  // Special handling for 3D printer room
  const is3DPrinterRoom = areaId === '3d_drucker_zimmer'

  // Special handling for kitchen (vacuum dashboard)
  const isVacuumRoom = areaId === 'kuche'

  // Special handling for bedroom (alarm widget)
  const isBedroomRoom = areaId === 'schlafzimmer'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/rooms"
          className="p-2 -ml-2 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{room.name}</h1>
          {!is3DPrinterRoom && !isVacuumRoom && (
            <p className="text-text-secondary">
              {totalLights > 0 && `${totalLights} Licht${totalLights > 1 ? 'er' : ''}`}
              {totalLights > 0 && roomTasks.length > 0 && ' • '}
              {roomTasks.length > 0 && `${roomTasks.length} Aufgabe${roomTasks.length > 1 ? 'n' : ''}`}
              {totalLights === 0 && roomTasks.length === 0 && 'Keine Geräte'}
            </p>
          )}
          {is3DPrinterRoom && (
            <p className="text-text-secondary">Bambu Lab 3D-Drucker Steuerung</p>
          )}
          {isVacuumRoom && (
            <p className="text-text-secondary">Roborock S7 Staubsauger Steuerung</p>
          )}
        </div>
      </div>

      {/* Music Banner - shows when music is playing in this room */}
      {showMusicBanner && <MusicBanner entityId={mediaPlayer} />}

      {/* 3D Printer Room: Show PrinterDashboard */}
      {is3DPrinterRoom && (
        <>
          {/* Power switch for 3D printer */}
          {switchLights.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Stromversorgung</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {switchLights.map(({ id, label }) => (
                  <SwitchLightWidget key={id} entityId={id} label={label} />
                ))}
              </div>
            </Card>
          )}
          <PrinterDashboard
            entityPrefix="a1_03919d4b2001225"
            roomId={room?.id}
          />
        </>
      )}

      {/* Küche: Show VacuumDashboard */}
      {isVacuumRoom && (
        <VacuumDashboard
          entityId="vacuum.roborock_s7"
          roomId={room?.id}
        />
      )}

      {/* Standard Room Layout */}
      {!is3DPrinterRoom && !isVacuumRoom && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lights */}
          {(lights.length > 0 || switchLights.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Lichter</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {/* Switch-based lights first (usually main lights) */}
                {switchLights.map(({ id, label }) => (
                  <SwitchLightWidget key={id} entityId={id} label={label} />
                ))}
                {/* Regular lights */}
                {lights.map((entityId) => (
                  <LightWidget key={entityId} entityId={entityId} showSlider />
                ))}
              </div>
            </Card>
          )}

          {/* Alarm - only for bedroom */}
          {isBedroomRoom && (
            <AlarmWidget variant="full" />
          )}

          {/* Media */}
          {mediaPlayer && entities.get(mediaPlayer)?.state !== 'unavailable' && (
            <Card>
              <CardHeader>
                <CardTitle>Musik</CardTitle>
              </CardHeader>
              <MediaWidget entityId={mediaPlayer} />
            </Card>
          )}

          {/* Tasks */}
          {roomTasks.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Aufgaben in diesem Raum</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {roomTasks.map((instance) => (
                  <TaskWidget key={instance.id} instance={instance} />
                ))}
              </div>
            </Card>
          )}

          {/* Empty state */}
          {lights.length === 0 && switchLights.length === 0 && !mediaPlayer && roomTasks.length === 0 && (
            <Card className="lg:col-span-2">
              <div className="text-center py-8 text-text-secondary">
                <p>Keine Steuerungsoptionen für diesen Raum konfiguriert.</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
