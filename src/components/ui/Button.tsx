import { type ButtonHTMLAttributes, forwardRef, useState, useCallback } from 'react'
import { clsx } from 'clsx'

interface RippleEffect {
  x: number
  y: number
  id: number
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow'
  size?: 'sm' | 'md' | 'lg'
  enableRipple?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      enableRipple = true,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<RippleEffect[]>([])

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (enableRipple && !disabled) {
          const button = e.currentTarget
          const rect = button.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const id = Date.now()

          setRipples((prev) => [...prev, { x, y, id }])

          setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== id))
          }, 600)
        }

        onClick?.(e)
      },
      [enableRipple, disabled, onClick]
    )

    return (
      <button
        ref={ref}
        className={clsx(
          'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'active:scale-[0.97]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'overflow-hidden',
          {
            // Primary with hover glow
            'bg-accent text-white hover:bg-accent-hover hover:shadow-glow-accent':
              variant === 'primary',
            // Secondary
            'bg-surface-elevated text-text-primary hover:bg-surface-hover border border-border/50':
              variant === 'secondary',
            // Ghost
            'bg-transparent text-text-primary hover:bg-surface-hover':
              variant === 'ghost',
            // Danger
            'bg-danger text-white hover:opacity-90': variant === 'danger',
            // Glow variant - neon border with animated glow
            'bg-transparent text-accent border border-accent/50 hover:border-accent hover:shadow-glow-accent animate-glow-pulse':
              variant === 'glow',
            // Sizes
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
            }}
          />
        ))}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
