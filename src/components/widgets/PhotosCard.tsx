import { Card } from '../ui/Card'
import { usePhotos, useLinks, type MemoryPhoto } from '../../hooks/useBff'

function jahreDiff(year: number): number {
  return new Date().getFullYear() - year
}

function jahreLabel(year: number): string {
  const diff = jahreDiff(year)
  return `vor ${diff} ${diff === 1 ? 'Jahr' : 'Jahren'}`
}

/**
 * Wählt die Bilder für die Karte: erst ein Foto je Jahrgang (jüngster zuerst),
 * danach mit weiteren Bildern auffüllen. Ohne diese Streuung zeigt die Karte
 * an manchen Tagen dreimal denselben Nachmittag, obwohl auch ältere Jahrgänge
 * Treffer hätten — und genau die Zeitspanne ist ja der Reiz.
 */
function waehleFotos(photos: MemoryPhoto[], anzahl: number): MemoryPhoto[] {
  const proJahr = new Map<number, MemoryPhoto>()
  for (const photo of photos) {
    if (!proJahr.has(photo.year)) proJahr.set(photo.year, photo)
  }
  const auswahl = [...proJahr.values()]
  if (auswahl.length < anzahl) {
    const bereitsDrin = new Set(auswahl.map((p) => p.id))
    auswahl.push(...photos.filter((p) => !bereitsDrin.has(p.id)))
  }
  return auswahl.slice(0, anzahl)
}

// „Heute vor X Jahren" — Immich-Erinnerungen im zarten Altrosa.
// Das erste Foto bekommt bewusst mehr Raum: die Erinnerung ist der
// emotionale Anker der Startseite, kein Thumbnail-Streifen.
export function PhotosCard() {
  const { data } = usePhotos()
  const { data: links } = useLinks()

  // Feature deaktiviert oder (noch) keine Fotos für diesen Tag → Karte weglassen
  if (!data || data.photos.length === 0) return null

  const [hero, ...weitere] = waehleFotos(data.photos, 3)
  const immich = links?.immich
  const photoHref = (id: string) => (immich ? `${immich}/photos/${id}` : undefined)

  return (
    <Card tone="photo" padding="lg">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="font-display font-bold text-photo-ink text-xl">
          Heute {jahreLabel(hero.year)}
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
          aria-label={`Foto von heute ${jahreLabel(hero.year)} in Immich öffnen`}
        >
          <img
            src={`/api/photos/${hero.id}/thumbnail`}
            alt={`Erinnerung aus ${hero.year}`}
            loading="lazy"
            className="w-full aspect-[4/3] object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </a>

        {/* Weitere Jahrgänge — gestapelt daneben, jeweils mit Jahresangabe,
            damit die Überschrift des Hauptbilds sie nicht falsch beschriftet */}
        {weitere.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-1 sm:grid-rows-2 gap-3">
            {weitere.map((photo) => (
              <a
                key={photo.id}
                href={photoHref(photo.id)}
                target="_blank"
                rel="noreferrer"
                className="relative block group min-w-0 overflow-hidden rounded-lg"
                aria-label={`Foto von heute ${jahreLabel(photo.year)} in Immich öffnen`}
              >
                <img
                  src={`/api/photos/${photo.id}/thumbnail`}
                  alt={`Erinnerung aus ${photo.year}`}
                  loading="lazy"
                  className="w-full h-full aspect-square sm:aspect-auto object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {photo.year !== hero.year && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-photo-ink/70 text-white text-[10px] font-medium">
                    {jahreLabel(photo.year)}
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
