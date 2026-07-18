import { Card } from '../ui/Card'
import { usePhotos } from '../../hooks/useBff'

// „Heute vor X Jahren" — Immich-Erinnerungen im zarten Altrosa.
export function PhotosCard() {
  const { data } = usePhotos()

  // Feature deaktiviert oder (noch) keine Fotos für diesen Tag → Karte weglassen
  if (!data || data.photos.length === 0) return null

  const photos = data.photos.slice(0, 3)

  return (
    <Card tone="photo" padding="lg">
      <h3 className="text-sm font-medium text-photo-text">Heute vor …</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <figure key={photo.id} className="min-w-0">
            <img
              src={`/api/photos/${photo.id}/thumbnail`}
              alt={`Foto aus ${photo.year}`}
              loading="lazy"
              className="aspect-square w-full object-cover rounded-lg"
            />
            <figcaption className="mt-1 text-xs text-photo-text">
              {new Date().getFullYear() - photo.year}{' '}
              {new Date().getFullYear() - photo.year === 1 ? 'Jahr' : 'Jahren'}
            </figcaption>
          </figure>
        ))}
      </div>
    </Card>
  )
}
