import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { clsx } from 'clsx'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  icon: ReactNode
  /** Pflicht — der Knopf trägt keinen sichtbaren Text. */
  label: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'glass' | 'solid' | 'ghost'
}

const sizes = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-12 h-12',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, label, size = 'md', variant = 'glass', ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex items-center justify-center rounded-full shrink-0',
        'transition-all duration-200 active:scale-95',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:text-text-muted',
        sizes[size],
        {
          'glass-inset text-ink hover:bg-white/90 shadow-pill': variant === 'glass',
          'bg-accent text-on-fill hover:bg-accent-hover shadow-float': variant === 'solid',
          'text-text-secondary hover:bg-white/40 hover:text-ink': variant === 'ghost',
        },
        className
      )}
      {...props}
    >
      {icon}
    </button>
  )
)

IconButton.displayName = 'IconButton'
