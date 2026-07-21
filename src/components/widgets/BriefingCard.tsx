import { GlassPanel } from '../ui/GlassPanel'
import { useBriefing } from '../../hooks/useBff'
import { useDaylightPhase } from '../../contexts/DaylightContext'
import type { DaylightPhase } from '../../lib/daylight'

interface BriefingCardProps {
  /** Vorname für die Begrüßung */
  name?: string
}

/**
 * Die Begrüßung folgt derselben Tagphase wie der Hintergrund. Eine
 * Uhrzeit-Grenze würde im Juni „Guten Abend" sagen, während draußen
 * und auf dem Schirm noch heller Tag ist.
 */
const greetings: Record<DaylightPhase, string> = {
  daemmerung: 'Guten Morgen',
  morgen: 'Guten Morgen',
  tag: 'Guten Tag',
  abend: 'Guten Abend',
  nacht: 'Gute Nacht',
}

export function BriefingCard({ name }: BriefingCardProps) {
  const { data: briefing } = useBriefing()
  const phase = useDaylightPhase()

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
    <GlassPanel level={3} padding="lg" className="animate-entrance flex flex-col">
      {/* Die Kugel trägt die Farben des Grundes — dasselbe Zeichen wie
          neben der Wortmarke, hier als Anker der Begrüßung. */}
      <span className="daylight-dot w-16 h-16 mb-5 self-center" aria-hidden="true" />

      <h2 className="font-display font-extrabold text-ink text-2xl leading-tight text-center text-balance">
        {greetings[phase]}
        {name ? (
          <>
            ,<br />
            {name}
          </>
        ) : (
          ''
        )}
      </h2>

      {briefingText && (
        <p className="text-text-primary mt-5 leading-relaxed whitespace-pre-line">
          {briefingText}
        </p>
      )}

      {statusLine && <p className="mt-auto pt-5 text-xs text-text-muted">{statusLine}</p>}
    </GlassPanel>
  )
}
