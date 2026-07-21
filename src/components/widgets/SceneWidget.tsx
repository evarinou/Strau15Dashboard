import { useState } from 'react'
import { Sparkles, Play } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { MeshTile } from '../ui/MeshTile'
import { useScene } from '../../contexts/HomeAssistantContext'

interface SceneWidgetProps {
  entityId: string
  /** `tile` = große Verlaufskachel für den Schnellzugriff der Startseite */
  variant?: 'card' | 'tile'
  /** Kurzform für die Kachel — HA-Namen sind dort meist zu lang. */
  label?: string
}

export function SceneWidget({ entityId, variant = 'card', label }: SceneWidgetProps) {
  const { friendlyName, activate } = useScene(entityId)
  const [isActivating, setIsActivating] = useState(false)

  const handleClick = async () => {
    setIsActivating(true)
    try {
      await activate()
    } finally {
      setTimeout(() => setIsActivating(false), 500)
    }
  }

  if (variant === 'tile') {
    return (
      <MeshTile
        seed={entityId}
        label={label || friendlyName || entityId}
        sublabel={isActivating ? 'Wird aktiviert' : undefined}
        icon={<Sparkles className={clsx('w-4 h-4', isActivating && 'animate-pulse')} />}
        arrowIcon={<Play className="w-4 h-4" />}
        active={isActivating}
        onClick={handleClick}
        aspect="wide"
      />
    )
  }

  return (
    <Card
      variant="interactive"
      className={clsx(
        'cursor-pointer select-none',
        isActivating && 'ring-2 ring-accent'
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
            isActivating ? 'bg-accent/20 text-accent' : 'glass-inset text-text-secondary'
          )}
        >
          <Sparkles className={clsx('w-5 h-5', isActivating && 'animate-pulse')} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{friendlyName || entityId}</p>
          <p className="text-xs text-text-secondary">Szene</p>
        </div>
      </div>
    </Card>
  )
}
