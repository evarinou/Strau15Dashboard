import { type HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { GlassPanel } from './GlassPanel'

/**
 * Adapter auf GlassPanel.
 *
 * Card behält seine alte Props-Signatur, rendert aber das neue Glas.
 * Dadurch stehen sämtliche Widgets sofort im Pastell-Glas-Design, ohne
 * dass jede Widget-Datei angefasst werden muss. Die Widgets wandern
 * schrittweise auf GlassPanel um; danach fällt diese Datei weg.
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  entrance?: boolean
  entranceDelay?: number
  glowOnActive?: boolean
  glowColor?: 'accent' | 'warning' | 'success' | 'cyan'
  tone?: 'default' | 'accent' | 'photo'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      entrance = false,
      entranceDelay = 0,
      glowOnActive = false,
      glowColor = 'accent',
      tone = 'default',
      children,
      ...props
    },
    ref
  ) => {
    // Aus dem Neon-Glow wird ein farbiger Ring — auf Glas liest sich
    // eine klare Kante deutlich besser als ein weicher Schein.
    const ringClasses = {
      accent: 'ring-2 ring-accent/45',
      warning: 'ring-2 ring-warning/45',
      success: 'ring-2 ring-success/45',
      cyan: 'ring-2 ring-text-secondary/40',
    }

    const entranceDelayClass =
      entranceDelay > 0 && entranceDelay <= 8 ? `animate-entrance-delay-${entranceDelay}` : ''

    return (
      <GlassPanel
        ref={ref}
        level={tone === 'accent' ? 3 : 2}
        padding={padding}
        interactive={variant === 'interactive'}
        className={clsx(
          tone === 'accent' && 'border-l-4 border-l-accent',
          tone === 'photo' && 'glass-photo',
          entrance && 'animate-entrance',
          entrance && entranceDelayClass,
          glowOnActive && ringClasses[glowColor],
          className
        )}
        {...props}
      >
        {children}
      </GlassPanel>
    )
  }
)

Card.displayName = 'Card'

type CardHeaderProps = HTMLAttributes<HTMLDivElement>

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex items-center justify-between mb-3', className)}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={clsx(
        'text-xs font-semibold uppercase tracking-wider text-text-secondary',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
)

CardTitle.displayName = 'CardTitle'
