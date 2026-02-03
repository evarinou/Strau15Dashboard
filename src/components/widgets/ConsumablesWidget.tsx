import { AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

interface ConsumablesWidgetProps {
  mainBrushLeft: number | null
  sideBrushLeft: number | null
  filterLeft: number | null
  sensorLeft: number | null
}

interface ConsumableItemProps {
  label: string
  percentage: number | null
  icon?: React.ReactNode
}

function getConsumableColor(percentage: number | null): string {
  if (percentage === null) return 'oklch(0.708 0.014 285.82)'
  if (percentage > 50) return 'oklch(0.627 0.194 149.21)' // Green
  if (percentage > 20) return 'oklch(0.769 0.188 70.08)' // Yellow
  return 'oklch(0.577 0.245 27.33)' // Red
}

function getConsumableClass(percentage: number | null): string {
  if (percentage === null) return 'bg-text-secondary/30'
  if (percentage > 50) return 'consumable-healthy'
  if (percentage > 20) return 'consumable-warning'
  return 'consumable-danger'
}

function ConsumableItem({ label, percentage, icon }: ConsumableItemProps) {
  const color = getConsumableColor(percentage)
  const barClass = getConsumableClass(percentage)
  const showWarning = percentage !== null && percentage <= 20

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-text-primary">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {showWarning && (
            <AlertTriangle
              className="w-4 h-4 text-danger animate-pulse"
              style={{ filter: 'drop-shadow(0 0 4px oklch(0.577 0.245 27.33 / 0.6))' }}
            />
          )}
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color }}
          >
            {percentage !== null ? `${Math.round(percentage)}%` : '--'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            barClass
          )}
          style={{
            width: percentage !== null ? `${Math.max(percentage, 2)}%` : '0%',
            boxShadow: percentage !== null ? `0 0 8px ${color.replace(')', ' / 0.5)')}` : undefined,
          }}
        />
      </div>
    </div>
  )
}

// SVG icons for consumables
function BrushIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v6M12 12v10M12 12l4-4M12 12l-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function SideBrushIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" strokeLinecap="round" />
    </svg>
  )
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M4 10h16M4 14h16" />
    </svg>
  )
}

function SensorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5v2M12 17v2M5 12h2M17 12h2" strokeLinecap="round" />
      <path d="M7.05 7.05l1.41 1.41M15.54 15.54l1.41 1.41M7.05 16.95l1.41-1.41M15.54 8.46l1.41-1.41" strokeLinecap="round" />
    </svg>
  )
}

export function ConsumablesWidget({
  mainBrushLeft,
  sideBrushLeft,
  filterLeft,
  sensorLeft,
}: ConsumablesWidgetProps) {
  const consumables = [
    { label: 'Hauptbürste', percentage: mainBrushLeft, icon: <BrushIcon className="w-4 h-4" /> },
    { label: 'Seitenbürste', percentage: sideBrushLeft, icon: <SideBrushIcon className="w-4 h-4" /> },
    { label: 'Filter', percentage: filterLeft, icon: <FilterIcon className="w-4 h-4" /> },
    { label: 'Sensoren', percentage: sensorLeft, icon: <SensorIcon className="w-4 h-4" /> },
  ]

  const hasAnyData = consumables.some(c => c.percentage !== null)
  const warnings = consumables.filter(c => c.percentage !== null && c.percentage <= 20)

  return (
    <div className="space-y-4">
      {/* Warning banner if any consumable is low */}
      {warnings.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-danger/10 border border-danger/30">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-danger">Wartung erforderlich: </span>
            <span className="text-text-secondary">
              {warnings.map(w => w.label).join(', ')} {warnings.length === 1 ? 'muss' : 'müssen'} ersetzt werden
            </span>
          </div>
        </div>
      )}

      {/* Consumables list */}
      {hasAnyData ? (
        <div className="space-y-4">
          {consumables.map((item) => (
            item.percentage !== null && (
              <ConsumableItem
                key={item.label}
                label={item.label}
                percentage={item.percentage}
                icon={item.icon}
              />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          <FilterIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Keine Verschleißdaten verfügbar</p>
        </div>
      )}

      {/* Legend */}
      {hasAnyData && (
        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full consumable-healthy" />
            <span>&gt;50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full consumable-warning" />
            <span>20-50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full consumable-danger" />
            <span>&lt;20%</span>
          </div>
        </div>
      )}
    </div>
  )
}
