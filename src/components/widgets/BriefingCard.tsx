import { Card } from '../ui/Card'
import { useBriefing } from '../../hooks/useBff'

interface BriefingCardProps {
  /** Vorname für die Begrüßung */
  name?: string
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Gute Nacht'
  if (hour < 11) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export function BriefingCard({ name }: BriefingCardProps) {
  const { data: briefing } = useBriefing()

  const dateLine = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Nicht-KI-Fassung aus den Rohbausteinen, falls (noch) kein Text existiert
  const fallbackParts: string[] = []
  if (briefing?.fallback && briefing.data) {
    const termine = briefing.data.kalender?.kommend7Tage?.slice(0, 3) ?? []
    if (termine.length > 0) {
      fallbackParts.push(`Demnächst: ${termine.map((t) => t.titel).join(', ')}.`)
    }
    const offen = briefing.data.choreQuest?.heuteOffen ?? []
    if (offen.length > 0) {
      fallbackParts.push(
        `Heute noch offen: ${offen.length} Aufgabe${offen.length > 1 ? 'n' : ''}.`
      )
    }
  }

  const briefingText = briefing?.text || fallbackParts.join(' ') || null

  const statusLine = briefing?.generatedAt
    ? `Stand: ${new Date(briefing.generatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
    : null

  return (
    <Card tone="accent" padding="lg" className="animate-entrance">
      {/* Begrüßung — Serif, die menschliche Stimme des Dashboards */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1
          className="font-serif text-accent-ink text-3xl sm:text-4xl"
          style={{ fontWeight: 560, fontVariationSettings: "'opsz' 40" }}
        >
          {greeting()}
          {name ? `, ${name}` : ''}
        </h1>
        <p className="text-sm text-text-secondary">{dateLine}</p>
      </div>

      {/* Briefing „Was war / was kommt" — ebenfalls Serif */}
      {briefingText && (
        <p
          className="font-serif text-accent-text mt-4 text-base sm:text-lg leading-relaxed max-w-prose whitespace-pre-line"
          style={{ fontWeight: 420, fontVariationSettings: "'opsz' 14" }}
        >
          {briefingText}
        </p>
      )}

      {/* Funktionales bleibt Sans */}
      {statusLine && <p className="mt-4 text-xs text-text-secondary">{statusLine}</p>}
    </Card>
  )
}
