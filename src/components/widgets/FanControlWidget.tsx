import { useState } from 'react'
import { Fan, Wind, Snowflake } from 'lucide-react'
import { clsx } from 'clsx'

export interface FanControl {
  id: string
  label: string
  type: 'aux' | 'chamber' | 'cooling' | 'generic'
  speed: number | null // 0-100
  isOn: boolean
  canControl: boolean
}

interface FanControlWidgetProps {
  fan: FanControl
  onSpeedChange?: (speed: number) => void
  className?: string
  color?: string
}

const FAN_ICONS = {
  aux: Wind,
  chamber: Fan,
  cooling: Snowflake,
  generic: Fan,
}

const FAN_COLORS = {
  aux: 'oklch(0.769 0.188 70.08)', // Yellow/warning
  chamber: 'oklch(0.623 0.214 259.13)', // Accent blue
  cooling: 'oklch(0.85 0.18 195)', // Cyan
  generic: 'oklch(0.627 0.194 149.21)', // Green
}

export function FanControlWidget({
  fan,
  onSpeedChange,
  className,
  color,
}: FanControlWidgetProps) {
  const [localSpeed, setLocalSpeed] = useState<number | null>(null)
  const displaySpeed = localSpeed ?? fan.speed ?? 0
  const fanColor = color || FAN_COLORS[fan.type]
  const Icon = FAN_ICONS[fan.type]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setLocalSpeed(value)
  }

  const handleCommit = () => {
    if (localSpeed !== null && onSpeedChange) {
      onSpeedChange(localSpeed)
      setLocalSpeed(null)
    }
  }

  const isActive = displaySpeed > 0

  return (
    <div
      className={clsx(
        'p-3 rounded-xl transition-all duration-300',
        isActive ? 'bg-surface-hover' : 'bg-surface-elevated/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={clsx(
            'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300',
            isActive ? 'bg-opacity-20' : 'bg-surface-hover'
          )}
          style={{
            backgroundColor: isActive ? `${fanColor}20` : undefined,
          }}
        >
          <Icon
            className={clsx(
              'w-5 h-5 transition-all duration-300',
              isActive && 'animate-spin-slow'
            )}
            style={{
              color: isActive ? fanColor : undefined,
              filter: isActive ? `drop-shadow(0 0 4px ${fanColor})` : undefined,
              animationDuration: isActive ? `${Math.max(0.5, 2 - displaySpeed / 100)}s` : undefined,
            }}
          />
        </div>

        {/* Label and speed */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium truncate">{fan.label}</span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: isActive ? fanColor : undefined }}
            >
              {displaySpeed}%
            </span>
          </div>

          {/* Slider */}
          <div className="relative h-2 group">
            {/* Track background */}
            <div className="absolute inset-0 rounded-full bg-surface-hover overflow-hidden">
              {/* Fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
                style={{
                  width: `${displaySpeed}%`,
                  backgroundColor: fanColor,
                  boxShadow: isActive ? `0 0 8px ${fanColor}` : undefined,
                }}
              />
            </div>

            {/* Input range */}
            {fan.canControl && (
              <input
                type="range"
                min={0}
                max={100}
                value={displaySpeed}
                onChange={handleChange}
                onMouseUp={handleCommit}
                onTouchEnd={handleCommit}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            )}

            {/* Thumb indicator */}
            <div
              className={clsx(
                'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-150',
                'group-hover:scale-125'
              )}
              style={{
                left: `calc(${displaySpeed}% - 6px)`,
                backgroundColor: fanColor,
                borderColor: '#fff',
                boxShadow: `0 0 6px ${fanColor}`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Multi-fan control panel
interface FanControlPanelProps {
  fans: FanControl[]
  onFanSpeedChange?: (fanId: string, speed: number) => void
  className?: string
}

export function FanControlPanel({
  fans,
  onFanSpeedChange,
  className,
}: FanControlPanelProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {fans.map((fan) => (
        <FanControlWidget
          key={fan.id}
          fan={fan}
          onSpeedChange={onFanSpeedChange ? (speed) => onFanSpeedChange(fan.id, speed) : undefined}
        />
      ))}
    </div>
  )
}
