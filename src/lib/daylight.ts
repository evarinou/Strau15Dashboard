import { useEffect, useState } from 'react'
import { useHA } from '../contexts/HomeAssistantContext'

export type DaylightPhase = 'daemmerung' | 'morgen' | 'tag' | 'abend' | 'nacht'

const PHASES: DaylightPhase[] = ['daemmerung', 'morgen', 'tag', 'abend', 'nacht']

/**
 * Sonnenstand → Stimmung. Die Schwellen sind Elevationsgrade, keine
 * Uhrzeiten: im Dezember ist um 16 Uhr Abend, im Juni nicht.
 */
function phaseFromSun(elevation: number, rising: boolean): DaylightPhase {
  if (elevation >= 12) return 'tag'
  if (elevation >= 2) return rising ? 'morgen' : 'abend'
  if (elevation >= -8) return rising ? 'daemmerung' : 'abend'
  return 'nacht'
}

/** Fallback, solange Home Assistant noch nicht verbunden ist. */
function phaseFromClock(hour: number): DaylightPhase {
  if (hour < 5) return 'nacht'
  if (hour < 7) return 'daemmerung'
  if (hour < 11) return 'morgen'
  if (hour < 17) return 'tag'
  if (hour < 21) return 'abend'
  return 'nacht'
}

function overrideFromUrl(): DaylightPhase | null {
  const value = new URLSearchParams(window.location.search).get('daylight')
  return PHASES.includes(value as DaylightPhase) ? (value as DaylightPhase) : null
}

/**
 * Liefert die aktuelle Tagphase und schreibt sie als data-daylight an
 * <html>. Das CSS in index.css hängt daran den kompletten Farbwechsel
 * auf — Mesh, Glas und bei Nacht auch die Textfarben.
 *
 * Zum Prüfen aller fünf Stimmungen ohne Warten: ?daylight=nacht
 */
export function useDaylight(): DaylightPhase {
  const { entities } = useHA()
  const [now, setNow] = useState(() => new Date().getHours())

  // Nur für den Uhr-Fallback nötig; mit HA treibt sun.sun die Updates.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().getHours()), 5 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  const sun = entities.get('sun.sun')
  const elevation = sun?.attributes?.elevation as number | undefined
  const rising = Boolean(sun?.attributes?.rising)

  const phase =
    overrideFromUrl() ??
    (typeof elevation === 'number' ? phaseFromSun(elevation, rising) : phaseFromClock(now))

  useEffect(() => {
    document.documentElement.dataset.daylight = phase
  }, [phase])

  return phase
}

/**
 * Blur ist der teuerste Teil des Designs pro Frame. Auf schwacher
 * Hardware (Küchendisplay) lässt er sich mit ?lite=1 oder dauerhaft
 * über localStorage abschalten — das Glas wird dann deckend statt
 * durchscheinend, der Look bleibt erkennbar.
 *
 * Wird aus main.tsx vor dem ersten Render aufgerufen.
 */
export function applyDisplayPreferences(): void {
  const query = new URLSearchParams(window.location.search).get('lite')
  if (query === '1') localStorage.setItem('perf-lite', '1')
  if (query === '0') localStorage.removeItem('perf-lite')

  document.documentElement.classList.toggle('perf-lite', localStorage.getItem('perf-lite') === '1')

  // Tagphase schon vor dem ersten Frame setzen. Sonst startet die Seite
  // in der Tag-Stimmung und blendet 12 Sekunden lang nach Nacht — das
  // Küchendisplay würde bei jedem Laden nachts hell aufleuchten.
  document.documentElement.dataset.daylight =
    overrideFromUrl() ?? phaseFromClock(new Date().getHours())
}
