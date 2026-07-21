import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onChange?: (checked: boolean) => void
  size?: 'sm' | 'md' | 'lg'
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked, onChange, size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 cursor-pointer rounded-full items-center',
          'transition-colors duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:cursor-not-allowed disabled:opacity-60',
          // Aus-Zustand über text-muted: der Ton kippt mit der Tagphase
          // mit, eine feste graue Fläche wäre nachts unsichtbar.
          checked ? 'bg-accent' : 'bg-text-muted/30',
          {
            'h-5 w-9': size === 'sm',
            'h-6 w-11': size === 'md',
            'h-7 w-14': size === 'lg',
          },
          className
        )}
        {...props}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block rounded-full bg-white shadow-pill',
            'transition-transform duration-300',
            {
              'h-4 w-4': size === 'sm',
              'h-5 w-5': size === 'md',
              'h-6 w-6': size === 'lg',
            },
            checked
              ? {
                  'translate-x-4': size === 'sm',
                  'translate-x-5': size === 'md',
                  'translate-x-7': size === 'lg',
                }
              : 'translate-x-0.5'
          )}
          style={{ transitionTimingFunction: 'var(--ease-spring)' }}
        />
      </button>
    )
  }
)

Toggle.displayName = 'Toggle'
