import { VolumeX } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { MediaWidget } from '../components/widgets'
import { useHA } from '../contexts/HomeAssistantContext'
import { MEDIA_PLAYERS, SCRIPTS } from '../config/entities'

export function Music() {
  const { entities, callService } = useHA()

  const players = MEDIA_PLAYERS.map((id) => entities.get(id)).filter(
    (p) => p && p.state !== 'unavailable'
  )
  const playingCount = players.filter((p) => p?.state === 'playing').length

  const stopAll = () => {
    callService({
      domain: 'script',
      service: 'turn_on',
      target: { entity_id: SCRIPTS.musikAus },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Musik</h1>
          <p className="text-text-secondary">
            {playingCount > 0
              ? `${playingCount} Player aktiv`
              : 'Keine Wiedergabe aktiv'}
          </p>
        </div>
        <Button variant="secondary" onClick={stopAll}>
          <VolumeX className="w-4 h-4 mr-2" />
          Alles stoppen
        </Button>
      </div>

      {/* Media Players */}
      <div className="grid sm:grid-cols-2 gap-4">
        {MEDIA_PLAYERS.map((entityId) => (
          <MediaWidget key={entityId} entityId={entityId} />
        ))}
      </div>
    </div>
  )
}
