import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Home,
  RotateCcw,
  Battery,
  BatteryCharging,
  Wind,
  Droplets,
  Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { VacuumStatus, FanSpeedMode, MopIntensity } from '../../contexts/HomeAssistantContext'

interface VacuumStatusBarProps {
  status: VacuumStatus
  statusText?: string
  battery: number | null
  isCharging: boolean
  fanSpeed: FanSpeedMode
  mopIntensity: MopIntensity
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

const STATUS_CONFIG: Record<VacuumStatus, {
  label: string
  color: string
  bgColor: string
  icon: typeof Play
  pulse: boolean
}> = {
  docked: {
    label: 'Angedockt',
    color: 'oklch(0.627 0.194 149.21)',
    bgColor: 'oklch(0.627 0.194 149.21 / 0.2)',
    icon: Home,
    pulse: false,
  },
  idle: {
    label: 'Bereit',
    color: 'oklch(0.627 0.194 149.21)',
    bgColor: 'oklch(0.627 0.194 149.21 / 0.2)',
    icon: CheckCircle2,
    pulse: false,
  },
  cleaning: {
    label: 'Reinigt',
    color: 'oklch(0.623 0.214 259.13)',
    bgColor: 'oklch(0.623 0.214 259.13 / 0.2)',
    icon: Play,
    pulse: true,
  },
  paused: {
    label: 'Pausiert',
    color: 'oklch(0.769 0.188 70.08)',
    bgColor: 'oklch(0.769 0.188 70.08 / 0.2)',
    icon: Pause,
    pulse: false,
  },
  returning: {
    label: 'Kehrt zurück',
    color: 'oklch(0.85 0.18 195)',
    bgColor: 'oklch(0.85 0.18 195 / 0.2)',
    icon: RotateCcw,
    pulse: true,
  },
  error: {
    label: 'Fehler',
    color: 'oklch(0.577 0.245 27.33)',
    bgColor: 'oklch(0.577 0.245 27.33 / 0.2)',
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

const FAN_SPEED_CONFIG: Record<FanSpeedMode, {
  label: string
  color: string
}> = {
  Silent: { label: 'Leise', color: 'oklch(0.627 0.194 149.21)' },
  Standard: { label: 'Standard', color: 'oklch(0.623 0.214 259.13)' },
  Medium: { label: 'Mittel', color: 'oklch(0.769 0.188 70.08)' },
  Turbo: { label: 'Turbo', color: 'oklch(0.577 0.245 27.33)' },
}

const MOP_INTENSITY_CONFIG: Record<MopIntensity, {
  label: string
  color: string
}> = {
  Off: { label: 'Aus', color: 'oklch(0.708 0.014 285.82)' },
  Low: { label: 'Niedrig', color: 'oklch(0.627 0.194 149.21)' },
  Medium: { label: 'Mittel', color: 'oklch(0.623 0.214 259.13)' },
  High: { label: 'Hoch', color: 'oklch(0.85 0.18 195)' },
}

export function VacuumStatusBar({
  status,
  statusText,
  battery,
  isCharging,
  fanSpeed,
  mopIntensity,
  className,
}: VacuumStatusBarProps) {
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon

  const getBatteryColor = () => {
    if (battery === null) return 'oklch(0.708 0.014 285.82)'
    if (battery > 50) return 'oklch(0.627 0.194 149.21)'
    if (battery > 20) return 'oklch(0.769 0.188 70.08)'
    return 'oklch(0.577 0.245 27.33)'
  }

  const fanConfig = FAN_SPEED_CONFIG[fanSpeed]
  const mopConfig = MOP_INTENSITY_CONFIG[mopIntensity]

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-2 p-2 rounded-xl bg-surface-elevated/30 backdrop-blur-sm',
        className
      )}
    >
      {/* Vacuum status badge */}
      <StatusBadge
        icon={<StatusIcon className={clsx('w-4 h-4', config.pulse && 'animate-pulse')} />}
        label="Status"
        value={statusText || config.label}
        color={config.color}
        bgColor={config.bgColor}
        pulse={config.pulse}
      />

      {/* Battery */}
      {battery !== null && (
        <StatusBadge
          icon={isCharging
            ? <BatteryCharging className="w-4 h-4" style={{ color: getBatteryColor() }} />
            : <Battery className="w-4 h-4" style={{ color: getBatteryColor() }} />
          }
          label="Akku"
          value={`${Math.round(battery)}%`}
          color={getBatteryColor()}
          bgColor={`${getBatteryColor().replace(')', ' / 0.15)')}`}
        />
      )}

      <div className="flex-1" />

      {/* Fan speed */}
      <StatusBadge
        icon={<Wind className="w-4 h-4" style={{ color: fanConfig.color }} />}
        label="Saugstärke"
        value={fanConfig.label}
        color={fanConfig.color}
        bgColor={`${fanConfig.color.replace(')', ' / 0.15)')}`}
      />

      {/* Mop intensity */}
      {mopIntensity !== 'Off' && (
        <StatusBadge
          icon={<Droplets className="w-4 h-4" style={{ color: mopConfig.color }} />}
          label="Wischen"
          value={mopConfig.label}
          color={mopConfig.color}
          bgColor={`${mopConfig.color.replace(')', ' / 0.15)')}`}
        />
      )}
    </div>
  )
}
