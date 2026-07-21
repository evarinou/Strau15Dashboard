import { useState } from 'react'
import { Flame, Square, Minus, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { SparklineChart } from './SparklineChart'

interface TemperatureControlWidgetProps {
  label: string
  type: 'nozzle' | 'bed' | 'chamber'
  currentTemp: number | null
  targetTemp: number | null
  history?: number[]
  minTemp?: number
  maxTemp?: number
  step?: number
  canControl?: boolean
  onTargetChange?: (temp: number) => void
  className?: string
}

const TYPE_CONFIG = {
  nozzle: {
    icon: Flame,
    color: 'oklch(0.8 0.2 70)', // Orange
    minDefault: 0,
    maxDefault: 300,
    stepDefault: 5,
  },
  bed: {
    icon: Square,
    color: 'rgb(from var(--color-accent) r g b)', // Cyan
    minDefault: 0,
    maxDefault: 120,
    stepDefault: 5,
  },
  chamber: {
    icon: Square,
    color: 'rgb(from var(--color-success) r g b)', // Green
    minDefault: 0,
    maxDefault: 60,
    stepDefault: 1,
  },
}

export function TemperatureControlWidget({
  label,
  type,
  currentTemp,
  targetTemp,
  history,
  minTemp,
  maxTemp,
  step,
  canControl = false,
  onTargetChange,
  className,
}: TemperatureControlWidgetProps) {
  const config = TYPE_CONFIG[type]
  const Icon = config.icon
  const color = config.color

  const effectiveMin = minTemp ?? config.minDefault
  const effectiveMax = maxTemp ?? config.maxDefault
  const effectiveStep = step ?? config.stepDefault

  const [localTarget, setLocalTarget] = useState<number | null>(null)
  const displayTarget = localTarget ?? targetTemp ?? 0

  const isHeating = currentTemp !== null && targetTemp !== null && currentTemp < targetTemp - 2
  const isAtTarget = currentTemp !== null && targetTemp !== null && Math.abs(currentTemp - targetTemp) <= 2

  const handleIncrement = () => {
    const newTarget = Math.min(displayTarget + effectiveStep, effectiveMax)
    if (canControl && onTargetChange) {
      onTargetChange(newTarget)
    }
    setLocalTarget(newTarget)
  }

  const handleDecrement = () => {
    const newTarget = Math.max(displayTarget - effectiveStep, effectiveMin)
    if (canControl && onTargetChange) {
      onTargetChange(newTarget)
    }
    setLocalTarget(newTarget)
  }

  return (
    <div
      className={clsx(
        'p-4 rounded-xl transition-all duration-300',
        isHeating && '',
        isAtTarget && '',
        !isHeating && !isAtTarget && 'bg-surface-elevated/50',
        className
      )}
    >
      {/* Header with icon and label */}
      <div className="flex items-center gap-2 mb-3">
        <Icon
          className={clsx(
            'w-5 h-5 transition-all duration-300',
            isHeating && 'animate-pulse'
          )}
          style={{
            color: color,
            filter: isHeating || isAtTarget ? `drop-shadow(0 0 4px ${color})` : undefined,
          }}
        />
        <span className="text-sm font-medium">{label}</span>
        <span
          className="ml-auto text-lg font-bold tabular-nums"
          style={{
            color: color,
            textShadow: isAtTarget ? `0 0 8px ${color}` : undefined,
          }}
        >
          {currentTemp !== null ? `${Math.round(currentTemp)}°C` : '--'}
        </span>
      </div>

      {/* Sparkline chart */}
      {history && history.length > 1 && (
        <div className="mb-3">
          <SparklineChart
            data={history}
            width={200}
            height={48}
            color={color}
            minY={effectiveMin}
            maxY={effectiveMax}
          />
        </div>
      )}

      {/* Target temperature control */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">Ziel:</span>

        <div className="flex items-center gap-2">
          {/* Decrement button */}
          {canControl && (
            <button
              onClick={handleDecrement}
              disabled={displayTarget <= effectiveMin}
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                'bg-surface-hover hover:bg-surface-hover/80 disabled:opacity-30'
              )}
            >
              <Minus className="w-4 h-4" />
            </button>
          )}

          {/* Target value display */}
          <div
            className={clsx(
              'px-4 py-1.5 rounded-lg text-center min-w-[80px]',
              canControl ? 'bg-surface-hover' : 'bg-surface-elevated/30'
            )}
            style={{
              borderColor: isAtTarget ? color : undefined,
              borderWidth: isAtTarget ? 1 : 0,
            }}
          >
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: displayTarget > 0 ? color : undefined }}
            >
              {displayTarget}°C
            </span>
          </div>

          {/* Increment button */}
          {canControl && (
            <button
              onClick={handleIncrement}
              disabled={displayTarget >= effectiveMax}
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                'bg-surface-hover hover:bg-surface-hover/80 disabled:opacity-30'
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status indicator */}
      {isHeating && (
        <div className="mt-2 flex items-center gap-2 text-xs" style={{ color }}>
          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Aufheizen...
        </div>
      )}
      {isAtTarget && (
        <div className="mt-2 flex items-center gap-2 text-xs text-success">
          <div className="w-1.5 h-1.5 rounded-full bg-current" />
          Zieltemperatur erreicht
        </div>
      )}
    </div>
  )
}
