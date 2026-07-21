import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { MeshTile } from '../ui/MeshTile'
import { useScript } from '../../contexts/HomeAssistantContext'

interface ScriptWidgetProps {
  entityId: string
  icon?: React.ReactNode
  /** `tile` = große Verlaufskachel für den Schnellzugriff der Startseite */
  variant?: 'card' | 'tile'
  /** Kurzform für die Kachel — HA-Namen sind dort meist zu lang. */
  label?: string
}

export function ScriptWidget({ entityId, icon, variant = 'card', label }: ScriptWidgetProps) {
  const { isRunning, friendlyName, run } = useScript(entityId)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleClick = async () => {
    if (isRunning || isExecuting) return
    setIsExecuting(true)
    try {
      await run()
    } finally {
      setTimeout(() => setIsExecuting(false), 1000)
    }
  }

  const showLoading = isRunning || isExecuting

  if (variant === 'tile') {
    return (
      <MeshTile
        seed={entityId}
        label={label || friendlyName || entityId}
        // Nur der Zustand, kein zweiter Name — der Entity-Name unter
        // dem Kurznamen wäre reine Wiederholung.
        sublabel={showLoading ? 'Läuft' : undefined}
        icon={showLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        arrowIcon={<Play className="w-4 h-4" />}
        active={showLoading}
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
        showLoading && 'ring-2 ring-accent'
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
            showLoading ? 'bg-accent/20 text-accent' : 'glass-inset text-text-secondary'
          )}
        >
          {showLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : icon ? (
            icon
          ) : (
            <Play className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{friendlyName || entityId}</p>
          <p className="text-xs text-text-secondary">
            {showLoading ? 'Wird ausgeführt...' : 'Script'}
          </p>
        </div>
      </div>
    </Card>
  )
}
