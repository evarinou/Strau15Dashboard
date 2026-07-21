import { useHA } from '../contexts/HomeAssistantContext'
import { MEDIA_PLAYERS } from '../config/entities'

export interface NowPlaying {
  entityId: string
  room: string
  title?: string
  artist?: string
  /** Album-Cover — relativer HA-Pfad, den der BFF proxyt. */
  entityPicture?: string
}

/**
 * Der erste Sonos-Player, der gerade spielt (oder null). Dient dem
 * „Now Playing"-Chip auf der Fotokarte — ein Blick genügt, um zu sehen,
 * dass Musik läuft, und ein Klick führt zur Musiksteuerung.
 */
export function useNowPlaying(): NowPlaying | null {
  const { entities } = useHA()

  for (const entityId of MEDIA_PLAYERS) {
    const entity = entities.get(entityId)
    if (entity?.state !== 'playing') continue

    const attrs = entity.attributes || {}
    return {
      entityId,
      room: (attrs.friendly_name as string | undefined) ?? entityId,
      title: attrs.media_title as string | undefined,
      artist: attrs.media_artist as string | undefined,
      entityPicture: attrs.entity_picture as string | undefined,
    }
  }
  return null
}
