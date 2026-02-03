import { Home, Play, Pause, Battery } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useVacuum } from '../../contexts/HomeAssistantContext'

interface VacuumWidgetProps {
  entityId: string
  entrance?: boolean
  entranceDelay?: number
}

// SVG Battery Ring Component
function BatteryRing({ percentage, color }: { percentage: number; color: string }) {
  const radius = 20
  const strokeWidth = 3
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
      {/* Background circle */}
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-surface-hover"
      />
      {/* Progress circle */}
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
    </svg>
  )
}

export function VacuumWidget({
  entityId,
  entrance = false,
  entranceDelay = 0,
}: VacuumWidgetProps) {
  const {
    state,
    isDocked,
    isCleaning,
    isReturning,
    battery,
    friendlyName,
    start,
    pause,
    returnToBase,
  } = useVacuum(entityId)

  const getBatteryColor = () => {
    if (!battery) return 'oklch(0.708 0.014 285.82)'
    if (battery > 50) return 'oklch(0.627 0.194 149.21)'
    if (battery > 20) return 'oklch(0.769 0.188 70.08)'
    return 'oklch(0.577 0.245 27.33)'
  }

  const getBatteryTextClass = () => {
    if (!battery) return 'text-text-secondary'
    if (battery > 50) return 'text-success'
    if (battery > 20) return 'text-warning'
    return 'text-danger'
  }

  const getStatusText = () => {
    if (isCleaning) return 'Reinigt...'
    if (isReturning) return 'Kehrt zurück...'
    if (isDocked) return 'An Ladestation'
    return state
  }

  const getGlowColor = (): 'accent' | 'success' | 'warning' | 'cyan' => {
    if (isCleaning) return 'accent'
    if (isReturning) return 'warning'
    if (isDocked && battery && battery > 90) return 'success'
    return 'accent'
  }

  return (
    <Card
      entrance={entrance}
      entranceDelay={entranceDelay}
      glowOnActive={isCleaning}
      glowColor={getGlowColor()}
    >
      <div className="flex items-center gap-4">
        {/* Icon with battery ring and animation */}
        <div className="relative w-12 h-12">
          {/* Battery ring */}
          {battery !== undefined && (
            <BatteryRing percentage={battery} color={getBatteryColor()} />
          )}
          {/* Center icon */}
          <div
            className={clsx(
              'absolute inset-2 rounded-full flex items-center justify-center transition-all duration-300',
              isCleaning
                ? 'bg-accent/20 text-accent'
                : isReturning
                  ? 'bg-warning/20 text-warning'
                  : 'bg-surface-hover text-text-secondary'
            )}
            style={{
              boxShadow: isCleaning
                ? '0 0 15px oklch(0.623 0.214 259.13 / 0.4)'
                : isReturning
                  ? '0 0 15px oklch(0.769 0.188 70.08 / 0.3)'
                  : 'none',
            }}
          >
            <Home
              className={clsx(
                'w-5 h-5 transition-all duration-300',
                isCleaning && 'animate-spin-slow icon-glow-accent',
                isReturning && 'animate-float icon-glow-warning'
              )}
            />
          </div>
          {/* Pulse ring when cleaning */}
          {isCleaning && (
            <div
              className="absolute inset-0 rounded-full animate-breathe"
              style={{
                background: 'radial-gradient(circle, oklch(0.623 0.214 259.13 / 0.3) 0%, transparent 70%)',
              }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className={clsx(
              'text-sm font-medium transition-all duration-300',
              isCleaning && 'text-glow-accent'
            )}
          >
            {friendlyName}
          </p>
          <p
            className={clsx(
              'text-xs transition-all duration-300',
              isCleaning
                ? 'text-accent'
                : isReturning
                  ? 'text-warning'
                  : 'text-text-secondary'
            )}
          >
            {getStatusText()}
          </p>
          {battery !== undefined && (
            <div className={clsx('flex items-center gap-1 text-xs mt-1', getBatteryTextClass())}>
              <Battery className="w-3 h-3" />
              <span className={clsx(isCleaning && 'font-medium')}>{battery}%</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {isCleaning ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={pause}
              className="hover:border-warning/50 hover:text-warning"
            >
              <Pause className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={start}
              className="hover:shadow-glow-accent"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          {!isDocked && (
            <Button
              size="sm"
              variant="ghost"
              onClick={returnToBase}
              className="hover:text-success hover:bg-success/10"
            >
              <Home className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
