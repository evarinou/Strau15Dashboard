import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { usePhotos, useLinks, type MemoryPhoto } from '../../hooks/useBff'
import { useNowPlaying } from '../../hooks/useNowPlaying'

/** „Juli 2019" — der Monat, in dem das Foto entstanden ist. */
function monthLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

// Position, Größe und Drehung der drei überlappenden Fotos. Absolut
// gesetzt in einem Container mit fester Höhe — das ergibt den gestreuten
// „Fotos auf dem Tisch"-Look statt eines braven Rasters.
const frames = [
  'left-0 top-[14%] w-[56%] h-[72%] -rotate-3 z-10',
  'right-[2%] top-0 w-[44%] h-[52%] rotate-[4deg] z-20',
  'right-[7%] bottom-[2%] w-[42%] h-[50%] -rotate-2 z-10',
]

// Zufällige Fotos, auf denen Eva-Maria und Lukas gemeinsam zu sehen sind
// (der BFF filtert über IMMICH_PEOPLE mit UND). Läuft gerade Musik, schwebt
// unten ein Chip mit Album-Cover, der zur Musiksteuerung führt.
export function PhotosCard() {
  const { data } = usePhotos()
  const { data: links } = useLinks()
  const nowPlaying = useNowPlaying()

  // Feature deaktiviert oder gerade keine Treffer → Karte weglassen
  if (!data || data.photos.length === 0) return null

  const photos: MemoryPhoto[] = data.photos.slice(0, 3)
  const immich = links?.immich
  const photoHref = (id: string) => (immich ? `${immich}/photos/${id}` : undefined)

  return (
    <Card tone="photo" padding="lg">
      <div className="flex items-baseline justify-between gap-3 mb-2">
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

      {/* Überlappender Foto-Stapel */}
      <div className="relative h-64 sm:h-72">
        {photos.map((photo, i) => (
          <a
            key={photo.id}
            href={photoHref(photo.id)}
            target="_blank"
            rel="noreferrer"
            aria-label="Foto in Immich öffnen"
            className={clsx(
              'absolute block p-1.5 bg-white rounded-2xl shadow-float-lg',
              'transition-transform duration-300 hover:z-30 hover:scale-[1.03]',
              frames[i]
            )}
          >
            <img
              src={`/api/photos/${photo.id}/thumbnail`}
              alt="Gemeinsame Erinnerung"
              loading="lazy"
              className="w-full h-full object-cover rounded-xl"
            />
            {/* Datum nur auf dem Hauptbild — sonst wird der Stapel unruhig */}
            {i === 0 && monthLabel(photo.takenAt) && (
              <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-photo-ink/70 text-white text-[11px] font-medium">
                {monthLabel(photo.takenAt)}
              </span>
            )}
          </a>
        ))}

        {/* Now Playing — schwebt über dem Stapel, führt zur Musik */}
        {nowPlaying && (
          <Link
            to="/music"
            className={clsx(
              'group absolute bottom-0 left-1 z-40 flex items-center gap-2.5 max-w-[75%]',
              'glass-l4 rounded-full pl-1.5 pr-3 py-1.5 shadow-pill',
              'transition-transform duration-200 hover:scale-[1.03]'
            )}
          >
            {nowPlaying.entityPicture ? (
              <img
                src={nowPlaying.entityPicture}
                alt=""
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 text-accent" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[11px] text-text-muted leading-none mb-0.5">
                Läuft gerade
              </span>
              <span className="block text-sm font-medium text-ink truncate leading-tight">
                {nowPlaying.title || nowPlaying.room}
              </span>
            </span>
            <span className="w-7 h-7 rounded-full bg-accent text-on-fill flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5" />
            </span>
          </Link>
        )}
      </div>
    </Card>
  )
}
