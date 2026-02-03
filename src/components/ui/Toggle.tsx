import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onChange?: (checked: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  glowWhenOn?: boolean
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked, onChange, size = 'md', glowWhenOn = true, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 cursor-pointer rounded-full transition-all',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Track styling with glow
          checked
            ? clsx(
                'bg-accent',
                glowWhenOn && 'shadow-[0_0_12px_oklch(0.623_0.214_259.13_/_0.5)]'
              )
            : 'bg-surface-hover',
          {
            'h-5 w-9': size === 'sm',
            'h-6 w-11': size === 'md',
            'h-7 w-14': size === 'lg',
          },
          className
        )}
        style={{
          transition: 'background-color 0.2s ease, box-shadow 0.3s ease',
        }}
        {...props}
      >
        {/* Thumb with glow effect */}
        <span
          className={clsx(
            'pointer-events-none inline-block transform rounded-full bg-white ring-0',
            'transition-all duration-300',
            // Size-based thumb dimensions
            {
              'h-4 w-4': size === 'sm',
              'h-5 w-5': size === 'md',
              'h-6 w-6': size === 'lg',
            },
            // Position based on checked state
            checked
              ? {
                  'translate-x-4': size === 'sm',
                  'translate-x-5': size === 'md',
                  'translate-x-7': size === 'lg',
                }
              : 'translate-x-0.5',
            // Glow shadow when on
            checked && glowWhenOn
              ? 'shadow-[0_0_8px_oklch(1_0_0_/_0.8),_0_2px_4px_oklch(0_0_0_/_0.2)]'
              : 'shadow-md'
          )}
          style={{
            marginTop: '2px',
            transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        />
      </button>
    )
  }
)

Toggle.displayName = 'Toggle'
