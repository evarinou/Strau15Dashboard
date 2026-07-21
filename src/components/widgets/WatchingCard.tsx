import { Film } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useMediaWatching, type MediaItem } from '../../hooks/useMedia'

// „Was schauen wir?" — Jellyfin: Weiterschauen + zuletzt hinzugefügt als
// horizontale Poster-Bänder. Read-only; Abspielen passiert am Fernseher.

function PosterTile({ item }: { item: MediaItem }) {
  return (
    <figure className="w-28 shrink-0 snap-start">
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden glass-inset">
        {/* Platzhalter liegt unter dem Bild — sichtbar, wenn es fehlt oder nicht lädt */}
        <Film className="absolute inset-0 m-auto w-7 h-7 text-text-muted" aria-hidden="true" />
        {item.image && (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        {item.progress != null && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-ink/25">
            <div className="h-full bg-accent" style={{ width: `${item.progress}%` }} />
          </div>
        )}
      </div>
      <figcaption className="mt-1.5 min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-[11px] text-text-muted truncate">{item.subtitle}</p>
        )}
      </figcaption>
    </figure>
  )
}

function PosterRow({ heading, items }: { heading: string; items: MediaItem[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
        {heading}
      </h3>
      <div className="flex gap-3 overflow-x-auto snap-x pb-1.5 -mx-1 px-1">
        {items.map((item) => (
          <PosterTile key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

export function WatchingCard() {
  const { data } = useMediaWatching()

  if (!data) return null

  const empty = data.watching.length === 0 && data.latest.length === 0

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Was schauen wir?</CardTitle>
      </CardHeader>
      {empty ? (
        <p className="text-sm text-text-secondary">Noch nichts in der Mediathek.</p>
      ) : (
        <div className="space-y-4">
          <PosterRow heading="Weiterschauen" items={data.watching} />
          <PosterRow heading="Zuletzt hinzugefügt" items={data.latest} />
        </div>
      )}
    </Card>
  )
}
