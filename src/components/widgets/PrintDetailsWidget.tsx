import {
  FileBox,
  Percent,
  Layers,
  Activity,
  Bell,
  Clock,
  Timer,
  Box,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { clsx } from 'clsx'

export interface PrintDetails {
  taskName: string | null
  progress: number | null
  currentLayer: number | null
  totalLayers: number | null
  status: string | null
  statusType: 'idle' | 'printing' | 'paused' | 'finished' | 'error' | 'unknown'
  hmsNotifications: string | null
  startTime: Date | null
  endTime: Date | null
  remainingTime: number | null // seconds
  activeTray: string | null
  activeTrayColor: string | null
  firmwareVersion: string | null
  printSpeed: number | null // percentage of normal speed
  printStage: string | null
}

interface PrintDetailsWidgetProps {
  details: PrintDetails
  className?: string
}

function formatTime(date: Date | null): string {
  if (!date) return '--'
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '--'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return '--'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Gerade eben'
  if (diffMins < 60) return `Vor ${diffMins} Minuten`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`
  const diffDays = Math.floor(diffHours / 24)
  return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`
}

interface DetailRowProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  valueColor?: string
  subValue?: string
}

function DetailRow({ icon, label, value, valueColor, subValue }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-5 h-5 mt-0.5 text-text-secondary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <div className="text-right flex-shrink-0">
        <div
          className="text-sm font-medium"
          style={{ color: valueColor }}
        >
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-text-secondary">{subValue}</div>
        )}
      </div>
    </div>
  )
}

export function PrintDetailsWidget({
  details,
  className,
}: PrintDetailsWidgetProps) {
  const getStatusIcon = () => {
    switch (details.statusType) {
      case 'printing':
        return <Activity className="w-4 h-4 text-accent animate-pulse" />
      case 'finished':
        return <CheckCircle2 className="w-4 h-4 text-success" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-danger" />
      case 'paused':
        return <Info className="w-4 h-4 text-warning" />
      default:
        return <Activity className="w-4 h-4 text-text-secondary" />
    }
  }

  const getStatusColor = () => {
    switch (details.statusType) {
      case 'printing': return 'rgb(216 90 48)'
      case 'finished': return 'rgb(76 122 92)'
      case 'error': return 'rgb(178 59 46)'
      case 'paused': return 'rgb(168 117 43)'
      default: return undefined
    }
  }

  return (
    <div className={clsx('p-4 rounded-xl bg-surface-elevated/50', className)}>
      <div className="divide-y divide-border/50">
        {/* Task name */}
        <DetailRow
          icon={<FileBox className="w-5 h-5" />}
          label="Aufgabe"
          value={
            <span className="truncate max-w-[180px] block">
              {details.taskName || 'Kein Druck'}
            </span>
          }
        />

        {/* Progress */}
        <DetailRow
          icon={<Percent className="w-5 h-5" />}
          label="Fortschritt"
          value={details.progress !== null ? `${Math.round(details.progress)}%` : '--'}
          valueColor={details.statusType === 'printing' ? 'rgb(216 90 48)' : undefined}
        />

        {/* Layer */}
        <DetailRow
          icon={<Layers className="w-5 h-5" />}
          label="Schicht"
          value={
            details.currentLayer !== null && details.totalLayers !== null
              ? `${details.currentLayer} / ${details.totalLayers}`
              : '--'
          }
        />

        {/* Status */}
        <DetailRow
          icon={getStatusIcon()}
          label="Status"
          value={details.status || 'Unbekannt'}
          valueColor={getStatusColor()}
        />

        {/* HMS Notifications */}
        {details.hmsNotifications && (
          <DetailRow
            icon={<Bell className="w-5 h-5" />}
            label="Benachrichtigungen"
            value={details.hmsNotifications}
            valueColor={details.hmsNotifications.toLowerCase().includes('ok')
              ? 'rgb(76 122 92)'
              : 'rgb(168 117 43)'
            }
          />
        )}

        {/* Start time */}
        <DetailRow
          icon={<Clock className="w-5 h-5" />}
          label="Startzeit"
          value={formatTime(details.startTime)}
          subValue={details.startTime ? formatRelativeTime(details.startTime) : undefined}
        />

        {/* End time */}
        <DetailRow
          icon={<Clock className="w-5 h-5" />}
          label="Geplantes Ende"
          value={formatTime(details.endTime)}
        />

        {/* Remaining time */}
        <DetailRow
          icon={<Timer className="w-5 h-5" />}
          label="Verbleibend"
          value={formatDuration(details.remainingTime)}
          valueColor={details.statusType === 'printing' ? 'rgb(216 90 48)' : undefined}
        />

        {/* Active tray */}
        {details.activeTray && (
          <DetailRow
            icon={<Box className="w-5 h-5" />}
            label="Aktives Material"
            value={
              <div className="flex items-center gap-2">
                {details.activeTrayColor && (
                  <div
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: details.activeTrayColor }}
                  />
                )}
                <span>{details.activeTray}</span>
              </div>
            }
          />
        )}

        {/* Firmware */}
        {details.firmwareVersion && (
          <DetailRow
            icon={<Cpu className="w-5 h-5" />}
            label="Firmware"
            value={details.firmwareVersion}
          />
        )}
      </div>
    </div>
  )
}
