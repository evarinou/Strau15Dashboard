import { type HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Deckkraft des Glases: 1 durchscheinend … 4 fast deckend */
  level?: 1 | 2 | 3 | 4
  radius?: 'tile' | 'panel' | 'plate'
  /**
   * `none` für Flächen innerhalb eines anderen Glas-Panels —
   * verschachtelte Blurs kosten pro Frame und bringen optisch nichts.
   */
  blur?: 'none' | 'sm' | 'md' | 'lg'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  as?: 'div' | 'section' | 'article' | 'aside'
}

/*
 * Vollständig ausgeschriebene Klassennamen — Tailwind scannt den
 * Quelltext statisch, zusammengesetzte Namen wie `glass-l${level}`
 * würden nie generiert werden.
 */
const levels = {
  1: 'glass-l1',
  2: 'glass-l2',
  3: 'glass-l3',
  4: 'glass-l4',
} as const

const blurs = {
  none: 'glass-blur-none',
  sm: 'glass-blur-sm',
  md: 'glass-blur-md',
  lg: 'glass-blur-lg',
} as const

const radii = {
  tile: 'r-tile',
  panel: 'r-panel',
  plate: 'r-plate',
} as const

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      className,
      level = 2,
      radius = 'panel',
      blur = 'md',
      padding = 'md',
      interactive = false,
      as: Tag = 'div',
      children,
      ...props
    },
    ref
  ) => (
    <Tag
      ref={ref}
      className={clsx(
        'glass-panel',
        levels[level],
        blurs[blur],
        radii[radius],
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
        },
        interactive && [
          'cursor-pointer transition-all duration-200',
          'hover:-translate-y-0.5 hover:shadow-float-lg',
          'active:translate-y-0 active:scale-[0.99]',
        ],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
)

GlassPanel.displayName = 'GlassPanel'
