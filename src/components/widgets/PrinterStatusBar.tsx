import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Thermometer,
  Droplets,
  Wind,
  Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { PrinterStatus } from '../../contexts/HomeAssistantContext'

interface PrinterStatusBarProps {
  status: PrinterStatus
  statusText?: string
  isOnline: boolean
  nozzleTemp?: number | null
  bedTemp?: number | null
  chamberTemp?: number | null
  humidity?: number | null
  airQuality?: number | null // AQI or PM2.5
  className?: string
}

interface StatusBadgeProps {
  icon: React.ReactNode
  label: string
  value?: string | number
  color?: string
  bgColor?: string
  pulse?: boolean
}

function StatusBadge({ icon, label, value, color, bgColor, pulse }: StatusBadgeProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        pulse && 'animate-pulse'
      )}
      style={{
        backgroundColor: bgColor || 'rgba(255,255,255,0.1)',
        color: color || undefined,
      }}
    >
      {icon}
      <span className="hidden sm:inline text-text-secondary">{label}</span>
      {value !== undefined && (
        <span className="font-bold" style={{ color }}>
          {value}
        </span>
      )}
    </div>
  )
}

const STATUS_CONFIG: Record<PrinterStatus, {
  label: string
  color: string
  bgColor: string
  icon: typeof Play
  pulse: boolean
}> = {
  idle: {
    label: 'Bereit',
    color: 'rgb(76 122 92)',
    bgColor: 'rgb(76 122 92 / 0.2)',
    icon: CheckCircle2,
    pulse: false,
  },
  printing: {
    label: 'Druckt',
    color: 'rgb(216 90 48)',
    bgColor: 'rgb(216 90 48 / 0.2)',
    icon: Play,
    pulse: true,
  },
  paused: {
    label: 'Pausiert',
    color: 'rgb(168 117 43)',
    bgColor: 'rgb(168 117 43 / 0.2)',
    icon: Pause,
    pulse: false,
  },
  finished: {
    label: 'Fertig',
    color: 'rgb(76 122 92)',
    bgColor: 'rgb(76 122 92 / 0.2)',
    icon: CheckCircle2,
    pulse: false,
  },
  error: {
    label: 'Fehler',
    color: 'rgb(178 59 46)',
    bgColor: 'rgb(178 59 46 / 0.2)',
    icon: AlertTriangle,
    pulse: true,
  },
  unknown: {
    label: 'Unbekannt',
    color: 'oklch(0.708 0.014 285.82)',
    bgColor: 'oklch(0.708 0.014 285.82 / 0.2)',
    icon: Loader2,
    pulse: false,
  },
}

export function PrinterStatusBar({
  status,
  statusText,
  isOnline,
  nozzleTemp,
  bedTemp,
  chamberTemp: _chamberTemp,
  humidity,
  airQuality,
  className,
}: PrinterStatusBarProps) {
  // chamberTemp could be shown if needed, currently unused
  void _chamberTemp
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon

  // Determine temperature warning colors
  const getNozzleTempColor = () => {
    if (nozzleTemp === null || nozzleTemp === undefined) return undefined
    if (nozzleTemp > 220) return 'oklch(0.65 0.25 35)' // Red/hot
    if (nozzleTemp > 180) return 'oklch(0.8 0.2 70)' // Orange
    if (nozzleTemp > 50) return 'oklch(0.85 0.18 100)' // Yellow
    return 'rgb(216 90 48)' // Cyan/cool
  }

  const getBedTempColor = () => {
    if (bedTemp === null || bedTemp === undefined) return undefined
    if (bedTemp > 80) return 'oklch(0.8 0.2 70)' // Orange
    if (bedTemp > 50) return 'oklch(0.85 0.18 100)' // Yellow
    return 'rgb(216 90 48)' // Cyan
  }

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-2 p-2 rounded-xl bg-surface-elevated/30 backdrop-blur-sm',
        className
      )}
    >
      {/* Print status badge */}
      <StatusBadge
        icon={<StatusIcon className={clsx('w-4 h-4', config.pulse && 'animate-pulse')} />}
        label="Status"
        value={statusText || config.label}
        color={config.color}
        bgColor={config.bgColor}
        pulse={config.pulse}
      />

      {/* Online status */}
      <StatusBadge
        icon={isOnline
          ? <Wifi className="w-4 h-4 text-success" />
          : <WifiOff className="w-4 h-4 text-danger" />
        }
        label="Drucker"
        value={isOnline ? 'Online' : 'Offline'}
        color={isOnline ? 'rgb(76 122 92)' : 'rgb(178 59 46)'}
        bgColor={isOnline ? 'rgb(76 122 92 / 0.2)' : 'rgb(178 59 46 / 0.2)'}
      />

      <div className="flex-1" />

      {/* Air quality */}
      {airQuality !== null && airQuality !== undefined && (
        <StatusBadge
          icon={<Wind className="w-4 h-4 text-neon-cyan" />}
          label="Luftqualität"
          value={`${airQuality} µg/m³`}
          color="rgb(216 90 48)"
          bgColor="rgb(216 90 48 / 0.15)"
        />
      )}

      {/* Nozzle temp */}
      {nozzleTemp !== null && nozzleTemp !== undefined && (
        <StatusBadge
          icon={<Thermometer className="w-4 h-4" style={{ color: getNozzleTempColor() }} />}
          label="Düse"
          value={`${Math.round(nozzleTemp)}°C`}
          color={getNozzleTempColor()}
          bgColor={`${getNozzleTempColor()?.replace(')', ' / 0.15)') || 'rgba(255,255,255,0.1)'}`}
        />
      )}

      {/* Bed temp */}
      {bedTemp !== null && bedTemp !== undefined && (
        <StatusBadge
          icon={<Thermometer className="w-4 h-4" style={{ color: getBedTempColor() }} />}
          label="Bett"
          value={`${Math.round(bedTemp)}°C`}
          color={getBedTempColor()}
          bgColor={`${getBedTempColor()?.replace(')', ' / 0.15)') || 'rgba(255,255,255,0.1)'}`}
        />
      )}

      {/* Humidity */}
      {humidity !== null && humidity !== undefined && (
        <StatusBadge
          icon={<Droplets className="w-4 h-4 text-accent" />}
          label="Feuchtigkeit"
          value={`${Math.round(humidity)}%`}
          color="rgb(216 90 48)"
          bgColor="rgb(216 90 48 / 0.15)"
        />
      )}
    </div>
  )
}
