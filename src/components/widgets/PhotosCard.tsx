import { Card } from '../ui/Card'
import { usePhotos, useLinks } from '../../hooks/useBff'

function jahreLabel(year: number): string {
  const diff = new Date().getFullYear() - year
  return `vor ${diff} ${diff === 1 ? 'Jahr' : 'Jahren'}`
}

// „Heute vor X Jahren" — Immich-Erinnerungen im zarten Altrosa.
// Das erste Foto bekommt bewusst mehr Raum: die Erinnerung ist der
// emotionale Anker der Startseite, kein Thumbnail-Streifen.
export function PhotosCard() {
  const { data } = usePhotos()
  const { data: links } = useLinks()

  // Feature deaktiviert oder (noch) keine Fotos für diesen Tag → Karte weglassen
  if (!data || data.photos.length === 0) return null

  const [hero, ...weitere] = data.photos.slice(0, 5)
  const immich = links?.immich
  const photoHref = (id: string) => (immich ? `${immich}/photos/${id}` : undefined)

  return (
    <Card tone="photo" padding="lg" className="lg:col-span-2">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="font-serif text-photo-ink text-xl" style={{ fontWeight: 520 }}>
          Heute vor {new Date().getFullYear() - hero.year}{' '}
          {new Date().getFullYear() - hero.year === 1 ? 'Jahr' : 'Jahren'}
        </h3>
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
          className="sm:col-span-2 block group"
          aria-label={`Foto aus ${hero.year} in Immich öffnen`}
        >
          <img
            src={`/api/photos/${hero.id}/thumbnail`}
            alt={`Erinnerung aus ${hero.year}`}
            loading="lazy"
            className="w-full aspect-[4/3] object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </a>

        {/* Weitere Erinnerungen — gestapelt daneben */}
        {weitere.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-1 sm:grid-rows-2 gap-3">
            {weitere.slice(0, 2).map((photo) => (
              <a
                key={photo.id}
                href={photoHref(photo.id)}
                target="_blank"
                rel="noreferrer"
                className="block group min-w-0"
                aria-label={`Foto aus ${photo.year} in Immich öffnen`}
              >
                <img
                  src={`/api/photos/${photo.id}/thumbnail`}
                  alt={`Erinnerung aus ${photo.year}`}
                  loading="lazy"
                  className="w-full h-full aspect-square sm:aspect-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <span className="sr-only">{jahreLabel(photo.year)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
