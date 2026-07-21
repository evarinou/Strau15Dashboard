import { Box, Droplets, Thermometer, Timer } from 'lucide-react'
import { clsx } from 'clsx'
import { SparklineChart } from './SparklineChart'

export interface AMSTray {
  slot: number
  material: string | null
  color: string | null
  colorHex: string | null
  remaining: number | null // 0-100 percentage
  isActive: boolean
  isEmpty: boolean
}

export interface AMSUnit {
  id: number
  name: string
  trays: AMSTray[]
  humidity: number | null
  humidityIndex: number | null
  temperature: number | null
  drying: boolean
  dryingTime: number | null // seconds remaining
}

interface AMSWidgetProps {
  units: AMSUnit[]
  className?: string
  compact?: boolean
}

// Filament spool SVG component
function FilamentSpool({
  color,
  remaining,
  isActive,
  isEmpty,
  size = 'md',
}: {
  color: string | null
  remaining: number | null
  isActive: boolean
  isEmpty: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeConfig = {
    sm: { width: 40, height: 48, fontSize: 'text-[10px]' },
    md: { width: 56, height: 64, fontSize: 'text-xs' },
    lg: { width: 72, height: 80, fontSize: 'text-sm' },
  }

  const config = sizeConfig[size]
  const fillColor = isEmpty ? '#3a3a4a' : (color || '#888')
  const fillHeight = isEmpty ? 0 : (remaining ?? 100)

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center transition-all duration-300',
        isActive && 'scale-105'
      )}
      style={{ width: config.width }}
    >
      {/* Active indicator ring */}
      {isActive && (
        <div
          className="absolute -inset-1 rounded-lg animate-breathe"
          style={{
            background: `radial-gradient(circle, ${fillColor}40 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Spool SVG */}
      <svg
        viewBox="0 0 40 48"
        width={config.width}
        height={config.height}
        className="relative z-10"
      >
        {/* Spool outline */}
        <rect
          x="4"
          y="4"
          width="32"
          height="40"
          rx="4"
          fill="#1a1a24"
          stroke={isActive ? fillColor : '#3a3a4a'}
          strokeWidth={isActive ? 2 : 1}
          style={isActive ? { filter: `drop-shadow(0 0 4px ${fillColor})` } : undefined}
        />

        {/* Spool hole */}
        <circle cx="20" cy="24" r="6" fill="#0a0a10" />

        {/* Filament fill (animated) */}
        {!isEmpty && (
          <rect
            x="8"
            y={8 + (32 * (100 - fillHeight) / 100)}
            width="24"
            height={32 * fillHeight / 100}
            rx="2"
            fill={fillColor}
            className="transition-all duration-500"
            style={{
              filter: isActive ? `drop-shadow(0 0 6px ${fillColor})` : undefined,
            }}
          />
        )}

        {/* Percentage text */}
        {!isEmpty && remaining !== null && (
          <text
            x="20"
            y="26"
            textAnchor="middle"
            fill="#fff"
            fontSize="10"
            fontWeight="bold"
            style={{ textShadow: '0 1px 2px #000' }}
          >
            {remaining}%
          </text>
        )}

        {/* Empty indicator */}
        {isEmpty && (
          <text
            x="20"
            y="26"
            textAnchor="middle"
            fill="#666"
            fontSize="8"
          >
            Leer
          </text>
        )}
      </svg>
    </div>
  )
}

// Single tray component
function AMSTraySlot({ tray, size = 'md' }: { tray: AMSTray; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300',
        tray.isActive
          ? 'bg-surface-hover border border-accent/30'
          : 'bg-surface-elevated/50 hover:bg-surface-hover/50'
      )}
    >
      <FilamentSpool
        color={tray.colorHex}
        remaining={tray.remaining}
        isActive={tray.isActive}
        isEmpty={tray.isEmpty}
        size={size}
      />
      <span
        className={clsx(
          'text-xs font-medium truncate max-w-full',
          tray.isActive ? 'text-accent' : tray.isEmpty ? 'text-text-secondary' : 'text-text-primary'
        )}
      >
        {tray.isEmpty ? 'Empty' : tray.material || `Slot ${tray.slot}`}
      </span>
    </div>
  )
}

// AMS unit stats (humidity, temp, drying)
function AMSStats({
  unit,
  temperatureHistory,
  humidityHistory,
}: {
  unit: AMSUnit
  temperatureHistory?: number[]
  humidityHistory?: number[]
}) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {/* Temperature */}
      <div className="flex flex-col items-center p-2 rounded-lg bg-surface-elevated/30">
        <Thermometer className="w-4 h-4 text-text-secondary mb-1" />
        <span className="text-xs text-text-secondary">Temperatur</span>
        <span className="text-sm font-bold text-text-secondary">
          {unit.temperature !== null ? `${unit.temperature}°C` : '--'}
        </span>
        {temperatureHistory && temperatureHistory.length > 1 && (
          <SparklineChart
            data={temperatureHistory}
            width={60}
            height={24}
            color="rgb(from var(--color-accent) r g b)"
            className="mt-1"
          />
        )}
      </div>

      {/* Humidity */}
      <div className="flex flex-col items-center p-2 rounded-lg bg-surface-elevated/30">
        <Droplets className="w-4 h-4 text-accent mb-1" />
        <span className="text-xs text-text-secondary">Feuchtigkeit</span>
        <span className="text-sm font-bold text-accent">
          {unit.humidity !== null ? `${unit.humidity}%` : '--'}
        </span>
        {humidityHistory && humidityHistory.length > 1 && (
          <SparklineChart
            data={humidityHistory}
            width={60}
            height={24}
            color="rgb(from var(--color-accent) r g b)"
            className="mt-1"
          />
        )}
      </div>

      {/* Drying status */}
      <div className="flex flex-col items-center p-2 rounded-lg bg-surface-elevated/30">
        <Timer className={clsx('w-4 h-4 mb-1', unit.drying ? 'text-warning animate-pulse' : 'text-text-secondary')} />
        <span className="text-xs text-text-secondary">Trocknung</span>
        {unit.drying ? (
          <span className="text-sm font-bold text-warning">
            {unit.dryingTime !== null
              ? `${Math.floor(unit.dryingTime / 60)}m`
              : 'Aktiv'}
          </span>
        ) : (
          <span className="text-sm text-text-secondary">Aus</span>
        )}
      </div>
    </div>
  )
}

export function AMSWidget({
  units,
  className,
  compact = false,
}: AMSWidgetProps) {
  if (units.length === 0) {
    return (
      <div className={clsx('p-4 rounded-xl bg-surface-elevated/50 text-center', className)}>
        <Box className="w-8 h-8 mx-auto mb-2 text-text-secondary" />
        <span className="text-sm text-text-secondary">Kein AMS verbunden</span>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {units.map((unit) => (
        <div key={unit.id} className="p-4 rounded-xl bg-surface-elevated/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{unit.name}</h3>
            <div className={clsx(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs',
              unit.drying ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
            )}>
              <div className={clsx(
                'w-1.5 h-1.5 rounded-full',
                unit.drying ? 'bg-warning animate-pulse' : 'bg-success'
              )} />
              {unit.drying ? 'Trocknet' : 'Bereit'}
            </div>
          </div>

          {/* Tray slots */}
          <div className={clsx(
            'grid gap-2',
            compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'
          )}>
            {unit.trays.map((tray) => (
              <AMSTraySlot
                key={tray.slot}
                tray={tray}
                size={compact ? 'sm' : 'md'}
              />
            ))}
          </div>

          {/* Stats */}
          {!compact && <AMSStats unit={unit} />}
        </div>
      ))}
    </div>
  )
}
