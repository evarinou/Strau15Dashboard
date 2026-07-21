import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { clsx } from 'clsx'
import { meshStyle } from '../../lib/mesh'
import { useDaylightPhase } from '../../contexts/DaylightContext'

export interface MeshTileProps {
  /** Bestimmt die Farbe — gleicher Seed ergibt immer dieselbe Kachel. */
  seed: string
  label: string
  sublabel?: string
  /** Echtes Bildmaterial (Foto, Album-Cover, Kamerabild) statt Verlauf. */
  image?: string
  icon?: ReactNode
  aspect?: 'square' | 'wide' | 'tall'
  to?: string
  onClick?: () => void
  /** Der runde Knopf unten rechts. Bei reinen Statuskacheln abschaltbar. */
  arrow?: boolean
  /** Ersetzt den Pfeil — Aktionskacheln zeigen, was passiert, statt „weiter". */
  arrowIcon?: ReactNode
  /** Zeigt einen Aktiv-Zustand an (z. B. Szene läuft gerade). */
  active?: boolean
  disabled?: boolean
  className?: string
}

const aspects = {
  square: 'aspect-square',
  wide: 'aspect-[16/10]',
  tall: 'aspect-[3/4]',
}

export function MeshTile({
  seed,
  label,
  sublabel,
  image,
  icon,
  aspect = 'wide',
  to,
  onClick,
  arrow = true,
  arrowIcon,
  active = false,
  disabled = false,
  className,
}: MeshTileProps) {
  const phase = useDaylightPhase()
  const night = phase === 'nacht'

  // Auf Fotos steht der Text immer auf einem Scrim, auf Verläufen nur
  // nachts in Weiß — tagsüber trägt der Pastellgrund dunkle Tinte besser.
  const onDark = Boolean(image) || night

  const content = (
    <>
      <div
        className="mesh-tile absolute inset-0"
        style={meshStyle(seed, phase)}
        aria-hidden="true"
      />

      {image && (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Scrim: nur wo Text auf unbekanntem Bildmaterial liegt */}
      {onDark && (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(transparent 42%, var(--scrim))' }}
          aria-hidden="true"
        />
      )}

      {/*
        Knopf oben rechts statt neben der Beschriftung: deutsche
        Komposita wie „Fernsehabend" brauchen die volle Kachelbreite,
        sonst bleibt nur „Fernse…" übrig.
      */}
      <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2">
        {icon ? (
          <span
            className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center',
              onDark ? 'bg-white/20 text-white' : 'bg-white/55 text-ink'
            )}
          >
            {icon}
          </span>
        ) : (
          <span />
        )}

        {arrow && (
          <span
            className={clsx(
              'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
              'transition-transform duration-200 group-hover:scale-110',
              onDark ? 'bg-white/25 text-white' : 'bg-white/70 text-ink shadow-pill'
            )}
            aria-hidden="true"
          >
            {arrowIcon ?? <ArrowUpRight className="w-4 h-4" />}
          </span>
        )}
      </div>

      {active && (
        <span
          className="absolute top-1/2 right-4 w-2.5 h-2.5 rounded-full bg-white shadow-float"
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p
          className={clsx(
            'font-display font-bold text-base leading-tight text-balance hyphens-auto',
            onDark ? 'text-white' : 'text-ink'
          )}
        >
          {label}
        </p>
        {sublabel && (
          <p
            className={clsx(
              'text-xs mt-0.5 truncate',
              onDark ? 'text-white/75' : 'text-text-secondary'
            )}
          >
            {sublabel}
          </p>
        )}
      </div>
    </>
  )

  const shell = clsx(
    'group relative block w-full overflow-hidden r-tile text-left',
    'shadow-float transition-all duration-200',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    aspects[aspect],
    disabled
      ? 'opacity-60 cursor-not-allowed'
      : 'hover:-translate-y-1 hover:shadow-float-lg active:translate-y-0 active:scale-[0.99]',
    className
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={shell}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={shell}>
      {content}
    </button>
  )
}
