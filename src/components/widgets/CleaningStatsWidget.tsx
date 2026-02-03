import { Home, Clock, Calendar, BarChart3, RotateCcw, Timer } from 'lucide-react'
import { clsx } from 'clsx'

interface CleaningStatsWidgetProps {
  // Last cleaning
  lastCleanArea: number | null
  lastCleanDuration: number | null
  lastCleanStart: Date | null
  lastCleanEnd: Date | null

  // Total stats
  totalCleanArea: number | null
  totalCleanCount: number | null
  totalCleanTime: number | null
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}min`
}

function formatTotalTime(hours: number | null): string {
  if (hours === null) return '--'
  return `${hours.toFixed(1)} h`
}

function formatArea(area: number | null): string {
  if (area === null) return '--'
  if (area >= 1000) return `${(area / 1000).toFixed(1)}k m²`
  return `${Math.round(area)} m²`
}

function formatDate(date: Date | null): string {
  if (!date) return '--'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const timeStr = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (diffDays === 0) return `Heute ${timeStr}`
  if (diffDays === 1) return `Gestern ${timeStr}`
  if (diffDays < 7) return `Vor ${diffDays} Tagen`

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface StatRowProps {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}

function StatRow({ icon, label, value, highlight = false }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 text-text-secondary">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span
        className={clsx(
          'text-sm font-medium tabular-nums',
          highlight ? 'text-accent text-glow-accent' : 'text-text-primary'
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function CleaningStatsWidget({
  lastCleanArea,
  lastCleanDuration,
  lastCleanStart,
  lastCleanEnd,
  totalCleanArea,
  totalCleanCount,
  totalCleanTime,
}: CleaningStatsWidgetProps) {
  const hasLastCleanData = lastCleanArea !== null || lastCleanDuration !== null || lastCleanEnd !== null
  const hasTotalData = totalCleanArea !== null || totalCleanCount !== null || totalCleanTime !== null

  return (
    <div className="space-y-4">
      {/* Last Cleaning Section */}
      {hasLastCleanData && (
        <div>
          <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Letzte Reinigung
          </h4>
          <div className="rounded-xl bg-surface-elevated/30 p-3 divide-y divide-border/30">
            {lastCleanArea !== null && (
              <StatRow
                icon={<Home className="w-4 h-4" />}
                label="Fläche"
                value={`${Math.round(lastCleanArea)} m²`}
                highlight
              />
            )}
            {lastCleanDuration !== null && (
              <StatRow
                icon={<Clock className="w-4 h-4" />}
                label="Dauer"
                value={formatDuration(lastCleanDuration)}
              />
            )}
            {lastCleanEnd !== null && (
              <StatRow
                icon={<Calendar className="w-4 h-4" />}
                label="Datum"
                value={formatDate(lastCleanEnd)}
              />
            )}
            {lastCleanStart !== null && lastCleanEnd === null && (
              <StatRow
                icon={<Calendar className="w-4 h-4" />}
                label="Gestartet"
                value={formatDate(lastCleanStart)}
              />
            )}
          </div>
        </div>
      )}

      {/* Total Stats Section */}
      {hasTotalData && (
        <div>
          <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Gesamt
          </h4>
          <div className="rounded-xl bg-surface-elevated/30 p-3 divide-y divide-border/30">
            {totalCleanArea !== null && (
              <StatRow
                icon={<BarChart3 className="w-4 h-4" />}
                label="Fläche"
                value={formatArea(totalCleanArea)}
              />
            )}
            {totalCleanCount !== null && (
              <StatRow
                icon={<RotateCcw className="w-4 h-4" />}
                label="Reinigungen"
                value={totalCleanCount.toString()}
              />
            )}
            {totalCleanTime !== null && (
              <StatRow
                icon={<Timer className="w-4 h-4" />}
                label="Laufzeit"
                value={formatTotalTime(totalCleanTime)}
              />
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasLastCleanData && !hasTotalData && (
        <div className="text-center py-8 text-text-secondary">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Keine Statistiken verfügbar</p>
        </div>
      )}
    </div>
  )
}
