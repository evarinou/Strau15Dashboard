import type { CSSProperties } from 'react'
import type { DaylightPhase } from './daylight'

/**
 * Deterministische Verlaufsflächen für Kacheln.
 *
 * Jede Kachel bekommt aus ihrem Seed (Raum-ID, Skriptname) für immer
 * dieselbe Farbstimmung. Das Bücherzimmer ist immer dasselbe Petrol,
 * das Schlafzimmer immer dasselbe Malve — nach ein paar Tagen greift
 * man die Kachel nach Farbe statt nach Text. Nichts wird gespeichert,
 * der Seed IST der Speicher.
 */

/**
 * Kuratierte Farbfamilie statt freier Streuung über den Farbkreis.
 * Ein reines `hash % 360` liefert zwar Abwechslung, aber auch Giftgrün
 * neben Knallgelb — die Kacheln sähen aus wie Bonbons statt wie ein
 * System. Diese sieben Ankerfarben stammen aus derselben Familie wie
 * der Hintergrund; der Seed wählt einen Anker und verschiebt ihn nur
 * um wenige Grad, damit zwei Nachbarn nie identisch wirken.
 */
const hueAnchors = [
  38,  // Pfirsich
  350, // Rosé
  318, // Malve
  272, // Flieder
  228, // Periwinkle
  188, // Petrol
  158, // Mint
]

/** FNV-1a — kurz, stabil, gleichmäßig verteilt. */
function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function hueFromSeed(seed: string): number {
  const h = hashSeed(seed)
  const anchor = hueAnchors[h % hueAnchors.length]
  const jitter = ((h >>> 8) % 17) - 8 // ±8°
  return (anchor + jitter + 360) % 360
}

/** Helligkeit/Sättigung der Kacheln folgen der Tageszeit wie der Grund. */
const phaseTone: Record<DaylightPhase, { l: number; c: number }> = {
  daemmerung: { l: 0.82, c: 0.075 },
  morgen: { l: 0.88, c: 0.095 },
  tag: { l: 0.87, c: 0.10 },
  abend: { l: 0.83, c: 0.105 },
  nacht: { l: 0.44, c: 0.085 },
}

/** Die vier Farbtupfer: Hue-Versatz, Position, Radius, L/C-Abweichung. */
const stops = [
  { dh: 0, x: 20, y: 25, r: 72, dl: -0.01, dc: 0.00 },
  { dh: 42, x: 85, y: 18, r: 66, dl: 0.03, dc: -0.03 },
  { dh: -38, x: 80, y: 86, r: 74, dl: -0.04, dc: 0.01 },
  { dh: 92, x: 15, y: 90, r: 62, dl: 0.01, dc: -0.02 },
]

export function meshStyle(seed: string, phase: DaylightPhase = 'tag'): CSSProperties {
  const hue = hueFromSeed(seed)
  const { l, c } = phaseTone[phase]

  const layers = stops.map(({ dh, x, y, r, dl, dc }) => {
    const h = (hue + dh + 360) % 360
    const color = `oklch(${(l + dl).toFixed(3)} ${Math.max(0, c + dc).toFixed(3)} ${h})`
    return `radial-gradient(${r}% ${r}% at ${x}% ${y}%, ${color} 0%, transparent 66%)`
  })

  return {
    backgroundImage: layers.join(', '),
    backgroundColor: `oklch(${(l - 0.03).toFixed(3)} ${(c * 0.6).toFixed(3)} ${hue})`,
  }
}

/**
 * Auf hellen Kacheln steht das Label in Tinte, auf nächtlichen in Weiß.
 * Echte Fotos bekommen unabhängig davon immer einen Scrim.
 */
export function meshLabelClass(phase: DaylightPhase): string {
  return phase === 'nacht' ? 'text-white' : 'text-ink'
}
