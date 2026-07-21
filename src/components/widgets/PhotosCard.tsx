import { Card } from '../ui/Card'
import { usePhotos, useLinks, type MemoryPhoto } from '../../hooks/useBff'

/** „Juli 2019" — der Monat, in dem das Foto entstanden ist. */
function monthLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

// Zufällige Fotos, auf denen Eva-Maria und Lukas gemeinsam zu sehen sind
// (der BFF filtert über IMMICH_PEOPLE mit UND). Das erste Bild bekommt
// bewusst mehr Raum — der Foto-Block ist der emotionale Anker der Startseite,
// kein Thumbnail-Streifen.
export function PhotosCard() {
  const { data } = usePhotos()
  const { data: links } = useLinks()

  // Feature deaktiviert oder gerade keine Treffer → Karte weglassen
  if (!data || data.photos.length === 0) return null

  const [hero, ...weitere]: MemoryPhoto[] = data.photos.slice(0, 3)
  const immich = links?.immich
  const photoHref = (id: string) => (immich ? `${immich}/photos/${id}` : undefined)

  return (
    <Card tone="photo" padding="lg">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="font-display font-bold text-photo-ink text-xl">Ihr beide</h3>
        {immich && (
          <a
            href={immich}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-photo-text hover:underline flex-shrink-0"
          >
            Alle Fotos
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Hauptbild — groß, über zwei Spalten */}
        <a
          href={photoHref(hero.id)}
          target="_blank"
          rel="noreferrer"
          className="sm:col-span-2 relative block group overflow-hidden rounded-xl"
          aria-label="Foto in Immich öffnen"
        >
          <img
            src={`/api/photos/${hero.id}/thumbnail`}
            alt="Gemeinsame Erinnerung"
            loading="lazy"
            className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
          {monthLabel(hero.takenAt) && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-photo-ink/70 text-white text-[11px] font-medium">
              {monthLabel(hero.takenAt)}
            </span>
          )}
        </a>

        {/* Weitere Bilder — gestapelt daneben */}
        {weitere.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-1 sm:grid-rows-2 gap-3">
            {weitere.map((photo) => (
              <a
                key={photo.id}
                href={photoHref(photo.id)}
                target="_blank"
                rel="noreferrer"
                className="relative block group min-w-0 overflow-hidden rounded-lg"
                aria-label="Foto in Immich öffnen"
              >
                <img
                  src={`/api/photos/${photo.id}/thumbnail`}
                  alt="Gemeinsame Erinnerung"
                  loading="lazy"
                  className="w-full h-full aspect-square sm:aspect-auto object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {monthLabel(photo.takenAt) && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-photo-ink/70 text-white text-[10px] font-medium">
                    {monthLabel(photo.takenAt)}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
