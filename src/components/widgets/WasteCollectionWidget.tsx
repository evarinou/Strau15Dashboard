import { Trash2, Package, FileText, Calendar, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useWasteCalendar, type WasteType } from '../../contexts/HomeAssistantContext'

interface WasteCollectionWidgetProps {
  entityId: string
  entrance?: boolean
  entranceDelay?: number
}

// Configuration for waste types
const WASTE_CONFIG: Record<
  WasteType,
  { icon: typeof Trash2; color: string; bgColor: string; glowColor: string }
> = {
  restmuell: {
    icon: Trash2,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    glowColor: 'oklch(0.5 0.02 285 / 0.3)',
  },
  gelber_sack: {
    icon: Package,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    glowColor: 'oklch(0.769 0.188 70.08 / 0.3)',
  },
  papier: {
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    glowColor: 'oklch(0.623 0.214 259.13 / 0.3)',
  },
  unknown: {
    icon: Trash2,
    color: 'text-text-secondary',
    bgColor: 'bg-surface-hover',
    glowColor: 'oklch(0.4 0.02 285 / 0.2)',
  },
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatDaysUntil(daysUntil: number): string {
  if (daysUntil === 0) return 'Heute'
  if (daysUntil === 1) return 'Morgen'
  if (daysUntil < 0) return 'Vergangen'
  return `in ${daysUntil} Tagen`
}

export function WasteCollectionWidget({
  entityId,
  entrance = false,
  entranceDelay = 0,
}: WasteCollectionWidgetProps) {
  const { events, nextPickup, hasSoonPickup, isAvailable } = useWasteCalendar(entityId)

  if (!isAvailable) {
    return (
      <Card entrance={entrance} entranceDelay={entranceDelay}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Müllabfuhr
          </CardTitle>
        </CardHeader>
        <div className="text-center py-4 text-text-secondary">
          <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nicht verfügbar</p>
        </div>
      </Card>
    )
  }

  if (!nextPickup) {
    return (
      <Card entrance={entrance} entranceDelay={entranceDelay}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" glow>
            <Calendar className="w-4 h-4" />
            Müllabfuhr
          </CardTitle>
        </CardHeader>
        <div className="text-center py-4 text-text-secondary">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Keine Termine</p>
        </div>
      </Card>
    )
  }

  const config = WASTE_CONFIG[nextPickup.type]

  return (
    <Card
      entrance={entrance}
      entranceDelay={entranceDelay}
      className={clsx(
        'overflow-hidden transition-all duration-300',
        hasSoonPickup && 'border-warning/40'
      )}
      style={{
        boxShadow: hasSoonPickup ? `0 0 20px oklch(0.769 0.188 70.08 / 0.15)` : undefined,
      }}
    >
      {/* Urgency background glow for today/tomorrow */}
      {nextPickup.isSoon && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none animate-glow-pulse"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${config.glowColor}, transparent 70%)`,
          }}
        />
      )}

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2" glow>
          <Calendar className="w-4 h-4" />
          Müllabfuhr
        </CardTitle>
        {hasSoonPickup && (
          <span
            className={clsx(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
              nextPickup.isToday
                ? 'bg-danger/20 text-danger'
                : 'bg-warning/20 text-warning'
            )}
            style={{
              boxShadow: nextPickup.isToday
                ? '0 0 10px oklch(0.577 0.245 27.33 / 0.3)'
                : '0 0 10px oklch(0.769 0.188 70.08 / 0.3)',
            }}
          >
            <AlertTriangle className="w-3 h-3" />
            {nextPickup.isToday ? 'Heute!' : 'Bald'}
          </span>
        )}
      </CardHeader>

      <div className="relative z-10 space-y-3">
        {events.slice(0, 3).map((event, index) => {
          const eventConfig = WASTE_CONFIG[event.type]
          const EventIcon = eventConfig.icon
          const isFirst = index === 0

          return (
            <div
              key={`${event.type}-${event.date.toISOString()}`}
              className={clsx(
                'flex items-center gap-3 p-2 rounded-lg transition-all duration-300',
                event.isSoon && 'bg-surface-hover/50',
                event.isToday && 'ring-1 ring-danger/30',
                event.isTomorrow && !event.isToday && 'ring-1 ring-warning/30'
              )}
              style={{
                boxShadow: event.isSoon ? `0 0 15px ${eventConfig.glowColor}` : undefined,
              }}
            >
              {/* Icon */}
              <div
                className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
                  eventConfig.bgColor
                )}
                style={{
                  boxShadow: event.isSoon ? `0 0 12px ${eventConfig.glowColor}` : undefined,
                }}
              >
                <EventIcon
                  className={clsx(
                    'w-5 h-5 transition-all duration-300',
                    eventConfig.color,
                    event.isSoon && isFirst && 'animate-float'
                  )}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    'text-sm font-medium truncate transition-all duration-300',
                    event.isToday && 'text-danger',
                    event.isTomorrow && !event.isToday && 'text-warning'
                  )}
                >
                  {event.label}
                </p>
                <p className="text-xs text-text-secondary">{formatDate(event.date)}</p>
              </div>

              {/* Days until badge */}
              <div
                className={clsx(
                  'text-xs px-2 py-1 rounded-md font-medium transition-all duration-300',
                  event.isToday
                    ? 'bg-danger/20 text-danger'
                    : event.isTomorrow
                      ? 'bg-warning/20 text-warning'
                      : 'bg-surface-hover text-text-secondary'
                )}
              >
                {formatDaysUntil(event.daysUntil)}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
