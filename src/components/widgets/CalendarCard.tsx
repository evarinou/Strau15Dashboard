import { Trash2, CalendarDays } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useCalendar } from '../../hooks/useBff'

function formatDay(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(date, today)) return 'Heute'
  if (sameDay(date, tomorrow)) return 'Morgen'
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Kalender-Block: nächste Müllabholung + weitere Termine (via BFF/HA).
export function CalendarCard() {
  const { data, isError } = useCalendar(14)

  if (isError || !data) return null

  const upcoming = data.events
    .filter((event) => new Date(event.allDay ? `${event.end}T23:59` : event.end) >= new Date())
    .slice(0, 5)

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Kalender</CardTitle>
      </CardHeader>
      {upcoming.length === 0 ? (
        <p className="text-sm text-text-secondary">Keine Termine in den nächsten zwei Wochen.</p>
      ) : (
        <ul className="space-y-2.5">
          {upcoming.map((event, index) => {
            const isWaste = event.calendar.includes('landkreis')
            const Icon = isWaste ? Trash2 : CalendarDays
            return (
              <li key={`${event.start}-${index}`} className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-accent-soft" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{event.summary}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDay(event.start)}
                    {!event.allDay &&
                      ` · ${new Date(event.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
