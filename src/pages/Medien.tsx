import { WatchingCard } from '../components/widgets/WatchingCard'
import { ComingUpCard } from '../components/widgets/ComingUpCard'
import { useMediaWatching, useMediaUpcoming } from '../hooks/useMedia'

// Medien-Kommandozentrum (Phase 3): Jellyfin, Sonarr/Radarr und Seerr als
// eine menschliche Ansicht. Die Bereiche „Was kommt?" und „Wunsch äußern"
// folgen in den nächsten Phasen.

export function Medien() {
  const watching = useMediaWatching()
  const upcoming = useMediaUpcoming()

  // Alle Bereiche serverseitig deaktiviert → kurzer Hinweis statt leerer
  // Seite; die Seite selbst bleibt immer erreichbar.
  const nichtsKonfiguriert =
    !watching.isPending && !watching.data && !upcoming.isPending && !upcoming.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-ink">
          Medien
        </h1>
        <p className="text-text-secondary mt-1">Schauen, stöbern, wünschen</p>
      </div>

      {nichtsKonfiguriert ? (
        <p className="text-sm text-text-secondary">
          Keine Medien-Dienste konfiguriert — im BFF z.B. JELLYFIN_URL und
          JELLYFIN_API_KEY setzen.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
            <WatchingCard />
            <ComingUpCard />
          </div>
        </div>
      )}
    </div>
  )
}
