import { Clapperboard } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useMediaUpcoming, type UpcomingItem } from '../../hooks/useMedia'

// „Was kommt?" — nächste Episoden (Sonarr) und Film-Releases (Radarr),
// gemerged und nach Datum sortiert.

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

function UpcomingRow({ item }: { item: UpcomingItem }) {
  return (
    <li className="flex items-center gap-3 min-w-0">
      <div className="relative w-9 aspect-[2/3] rounded-lg overflow-hidden glass-inset flex-shrink-0">
        <Clapperboard
          className="absolute inset-0 m-auto w-4 h-4 text-text-muted"
          aria-hidden="true"
        />
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-text-secondary truncate">{item.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {item.hasFile && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-success-fill"
            title="Schon verfügbar"
          />
        )}
        <span className="text-xs text-text-muted">{formatDay(item.date)}</span>
      </div>
    </li>
  )
}

export function ComingUpCard() {
  const { data } = useMediaUpcoming(14)

  if (!data) return null

  const offline = [
    !data.sources.sonarr && 'Serien (Sonarr)',
    !data.sources.radarr && 'Filme (Radarr)',
  ].filter(Boolean)

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Was kommt?</CardTitle>
      </CardHeader>
      {data.items.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Nichts Neues in den nächsten zwei Wochen.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {data.items.slice(0, 8).map((item) => (
            <UpcomingRow key={`${item.source}-${item.id}-${item.date}`} item={item} />
          ))}
        </ul>
      )}
      {offline.length > 0 && (
        <p className="mt-3 text-xs text-warning">{offline.join(' und ')} gerade nicht erreichbar.</p>
      )}
    </Card>
  )
}
