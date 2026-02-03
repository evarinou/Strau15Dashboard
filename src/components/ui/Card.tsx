import { type HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  entrance?: boolean
  entranceDelay?: number
  glowOnActive?: boolean
  glowColor?: 'accent' | 'warning' | 'success' | 'cyan'
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
      children,
      ...props
    },
    ref
  ) => {
    const glowClasses = {
      accent: 'border-glow-accent border-accent/40',
      warning: 'border-glow-on border-warning/40',
      success: 'border-glow-success border-success/40',
      cyan: 'border-glow-cyan border-neon-cyan/40',
    }

    const entranceDelayClass = entranceDelay > 0 && entranceDelay <= 8
      ? `animate-entrance-delay-${entranceDelay}`
      : ''

    return (
      <div
        ref={ref}
        className={clsx(
          // Base glass-morphism style
          'relative rounded-xl glass border border-border/30',
          // Gradient border overlay
          'before:absolute before:inset-0 before:rounded-xl before:p-[1px]',
          'before:bg-gradient-to-br before:from-border/40 before:via-transparent before:to-border/20',
          'before:-z-10 before:pointer-events-none',
          {
            // Interactive variant
            'transition-all duration-200 cursor-pointer': variant === 'interactive',
            'hover:bg-surface-hover/80 hover:border-border/50': variant === 'interactive',
            'hover:-translate-y-0.5 hover:shadow-float': variant === 'interactive',
            'active:scale-[0.98] active:translate-y-0': variant === 'interactive',
            // Padding
            'p-0': padding === 'none',
            'p-3': padding === 'sm',
            'p-4': padding === 'md',
            'p-6': padding === 'lg',
            // Entrance animation
            'animate-entrance': entrance,
            [entranceDelayClass]: entrance && entranceDelayClass,
            // Glow on active
            [glowClasses[glowColor]]: glowOnActive,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex items-center justify-between mb-3', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  glow?: boolean
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, glow = false, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={clsx(
          'text-sm font-medium text-text-secondary',
          glow && 'text-glow-accent',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = 'CardTitle'
