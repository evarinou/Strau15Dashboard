import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface TemperatureGaugeProps {
  label: string
  icon: ReactNode
  currentTemp: number | null
  targetTemp?: number | null
  maxTemp?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Temperature color scale: cold (blue) → warm (cyan) → hot (yellow) → very hot (orange/red)
function getTempColor(temp: number, maxTemp: number): string {
  const ratio = Math.min(temp / maxTemp, 1)

  if (ratio < 0.15) {
    // Cold - Blue
    return 'oklch(0.7 0.15 240)'
  } else if (ratio < 0.35) {
    // Warming - Cyan
    return 'oklch(0.8 0.16 200)'
  } else if (ratio < 0.55) {
    // Warm - Yellow-Green
    return 'oklch(0.85 0.18 100)'
  } else if (ratio < 0.75) {
    // Hot - Yellow/Orange
    return 'oklch(0.8 0.2 70)'
  } else {
    // Very Hot - Orange/Red
    return 'oklch(0.65 0.25 35)'
  }
}

function getTempColorClass(temp: number, maxTemp: number): string {
  const ratio = Math.min(temp / maxTemp, 1)

  if (ratio < 0.15) return 'temp-cold'
  if (ratio < 0.35) return 'temp-warming'
  if (ratio < 0.55) return 'temp-warm'
  if (ratio < 0.75) return 'temp-hot'
  return 'temp-very-hot'
}

const sizes = {
  sm: { width: 80, radius: 32, stroke: 4, fontSize: 'text-lg', labelSize: 'text-[10px]' },
  md: { width: 100, radius: 40, stroke: 5, fontSize: 'text-xl', labelSize: 'text-xs' },
  lg: { width: 120, radius: 48, stroke: 6, fontSize: 'text-2xl', labelSize: 'text-sm' },
}

export function TemperatureGauge({
  label,
  icon,
  currentTemp,
  targetTemp,
  maxTemp = 300,
  size = 'md',
  className,
}: TemperatureGaugeProps) {
  const config = sizes[size]
  const displayTemp = currentTemp ?? 0
  const percentage = Math.min(displayTemp / maxTemp, 1)

  // SVG arc calculations
  const circumference = 2 * Math.PI * config.radius
  const arcLength = circumference * 0.75 // 270 degree arc
  const strokeDashoffset = arcLength - percentage * arcLength

  const tempColor = getTempColor(displayTemp, maxTemp)
  const tempClass = getTempColorClass(displayTemp, maxTemp)

  // Check if target temperature is reached (within 2 degrees)
  const targetReached = targetTemp !== null && targetTemp !== undefined
    && currentTemp !== null
    && Math.abs(currentTemp - targetTemp) <= 2

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      {/* Gauge SVG */}
      <div
        className="relative"
        style={{ width: config.width, height: config.width }}
      >
        <svg
          viewBox={`0 0 ${config.width} ${config.width}`}
          className="transform rotate-[135deg]"
        >
          {/* Background arc */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            className="text-surface-hover"
          />
          {/* Value arc */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            fill="none"
            stroke={tempColor}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            className={clsx(
              'transition-all duration-700 ease-out',
              targetReached && 'animate-temp-pulse'
            )}
            style={{
              filter: `drop-shadow(0 0 ${targetReached ? 8 : 4}px ${tempColor})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Icon */}
          <div
            className={clsx(
              'mb-1 transition-all duration-300',
              tempClass,
              targetReached && 'animate-temp-pulse'
            )}
            style={{
              filter: targetReached ? `drop-shadow(0 0 6px ${tempColor})` : undefined,
            }}
          >
            {icon}
          </div>

          {/* Temperature value */}
          <span
            className={clsx(
              config.fontSize,
              'font-bold tabular-nums transition-all duration-300',
              tempClass
            )}
            style={{
              textShadow: targetReached ? `0 0 10px ${tempColor}` : undefined,
            }}
          >
            {currentTemp !== null ? `${Math.round(currentTemp)}°` : '--'}
          </span>

          {/* Target indicator */}
          {targetTemp !== null && targetTemp !== undefined && targetTemp > 0 && (
            <span className={clsx(config.labelSize, 'text-text-secondary mt-0.5')}>
              → {Math.round(targetTemp)}°
            </span>
          )}
        </div>

        {/* Glow effect when target reached */}
        {targetReached && (
          <div
            className="absolute inset-0 rounded-full animate-breathe pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${tempColor.replace(')', ' / 0.2)')} 0%, transparent 70%)`,
            }}
          />
        )}
      </div>

      {/* Label */}
      <span className={clsx(config.labelSize, 'text-text-secondary mt-2 font-medium')}>
        {label}
      </span>
    </div>
  )
}
