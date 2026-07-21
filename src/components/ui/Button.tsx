import { type ButtonHTMLAttributes, forwardRef, useState, useCallback } from 'react'
import { clsx } from 'clsx'

interface RippleEffect {
  x: number
  y: number
  id: number
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `secondary` ist die Glas-Variante — sie sitzt auf dem Panel, nicht darauf. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
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
          'relative inline-flex items-center justify-center rounded-full font-semibold',
          'transition-all duration-200 overflow-hidden active:scale-[0.97]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          // Auf Glas ist eine ausgegraute Fläche kaum noch zu sehen —
          // deshalb gedämpfte Schrift statt globaler Transparenz.
          'disabled:cursor-not-allowed disabled:text-text-muted disabled:active:scale-100',
          {
            'bg-accent text-on-fill hover:bg-accent-hover shadow-float disabled:bg-white/40':
              variant === 'primary',
            'glass-inset text-ink hover:bg-white/90 shadow-pill': variant === 'secondary',
            'bg-transparent text-text-secondary hover:bg-white/40 hover:text-ink':
              variant === 'ghost',
            'bg-danger text-on-fill hover:opacity-90 shadow-float': variant === 'danger',

            'h-8 px-3.5 text-sm': size === 'sm',
            'h-10 px-5 text-sm': size === 'md',
            'h-12 px-7 text-base': size === 'lg',
          },
          className
        )}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
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
