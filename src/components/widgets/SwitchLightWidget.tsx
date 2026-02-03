import { useState } from 'react'
import { Lightbulb, LightbulbOff } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { useSwitch } from '../../contexts/HomeAssistantContext'

interface SwitchLightWidgetProps {
  entityId: string
  label?: string
}

export function SwitchLightWidget({ entityId, label }: SwitchLightWidgetProps) {
  const { isOn, isUnavailable, friendlyName, toggle } = useSwitch(entityId)
  const [isPressed, setIsPressed] = useState(false)

  return (
    <Card
      variant="interactive"
      className={clsx(
        'cursor-pointer select-none',
        isPressed && 'scale-[0.98]',
        isUnavailable && 'opacity-50'
      )}
      onClick={() => !isUnavailable && toggle()}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
            isOn ? 'bg-warning/20 text-warning' : 'bg-surface-hover text-text-secondary'
          )}
        >
          {isOn ? (
            <Lightbulb className="w-5 h-5" />
          ) : (
            <LightbulbOff className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{label || friendlyName || entityId}</p>
          <p className="text-xs text-text-secondary">
            {isUnavailable ? 'Nicht verfügbar' : isOn ? 'An' : 'Aus'}
          </p>
        </div>
      </div>
    </Card>
  )
}
